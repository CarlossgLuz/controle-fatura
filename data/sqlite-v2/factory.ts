import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { SQLiteV2Error } from '@/data/sqlite-v2/errors';
import { migrateSQLiteV2, type SQLiteV2MigrationResult } from '@/data/sqlite-v2/migrations';
import type {
  SQLiteV2BindParams,
  SQLiteV2DatabasePort,
  SQLiteV2ExecutorPort,
} from '@/data/sqlite-v2/port';
import { SQLITE_V2_DATABASE_NAME } from '@/data/sqlite-v2/schema';

interface ExpoSQLiteExecutorLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: readonly unknown[]): Promise<{
    changes: number;
    lastInsertRowId: number;
  }>;
  getFirstAsync<T>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
}

interface ExpoSQLiteDatabaseLike extends ExpoSQLiteExecutorLike {
  withExclusiveTransactionAsync(
    task: (transaction: ExpoSQLiteExecutorLike) => Promise<void>
  ): Promise<void>;
  closeAsync(): Promise<void>;
}

export interface OpenSQLiteV2Options {
  readonly platform?: string;
  readonly openDatabaseAsync?: (databaseName: string) => Promise<ExpoSQLiteDatabaseLike>;
  readonly now?: () => string;
}

export interface OpenedSQLiteV2 {
  readonly databaseName: typeof SQLITE_V2_DATABASE_NAME;
  readonly database: SQLiteV2DatabasePort;
  readonly migration: SQLiteV2MigrationResult;
  closeAsync(): Promise<void>;
}

function executorPort(executor: ExpoSQLiteExecutorLike): SQLiteV2ExecutorPort {
  return {
    execAsync: (sql) => executor.execAsync(sql),
    runAsync: (sql, params: SQLiteV2BindParams = []) => executor.runAsync(sql, params),
    getFirstAsync: <T>(sql: string, params: SQLiteV2BindParams = []) =>
      executor.getFirstAsync<T>(sql, params),
    getAllAsync: <T>(sql: string, params: SQLiteV2BindParams = []) =>
      executor.getAllAsync<T>(sql, params),
  };
}

export function sqliteV2DatabasePort(database: ExpoSQLiteDatabaseLike): SQLiteV2DatabasePort {
  return {
    ...executorPort(database),
    withExclusiveTransactionAsync: (task) =>
      database.withExclusiveTransactionAsync((transaction) => task(executorPort(transaction))),
  };
}

export async function openSQLiteV2(options: OpenSQLiteV2Options = {}): Promise<OpenedSQLiteV2> {
  const platform = options.platform ?? Platform.OS;
  if (platform === 'web') throw new SQLiteV2Error('capability_unavailable');

  const openDatabaseAsync =
    options.openDatabaseAsync ??
    (SQLite.openDatabaseAsync as unknown as OpenSQLiteV2Options['openDatabaseAsync']);
  if (!openDatabaseAsync) throw new SQLiteV2Error('capability_unavailable');

  const nativeDatabase = await openDatabaseAsync(SQLITE_V2_DATABASE_NAME);
  const database = sqliteV2DatabasePort(nativeDatabase);
  let migration: SQLiteV2MigrationResult;
  try {
    migration = await migrateSQLiteV2(database, { now: options.now });
  } catch (error) {
    try {
      await nativeDatabase.closeAsync();
    } catch {
      // Preserve the actionable migration error; the close path has no safe fallback.
    }
    throw error;
  }

  return Object.freeze({
    databaseName: SQLITE_V2_DATABASE_NAME,
    database,
    migration,
    closeAsync: () => nativeDatabase.closeAsync(),
  });
}
