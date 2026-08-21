import * as SQLite from 'expo-sqlite';

import { openSQLiteV2, SQLiteV2Error } from '@/data/sqlite-v2';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

const mockedOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock;

interface NativeDatabaseDouble {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    params?: readonly unknown[]
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync(sql: string): Promise<unknown>;
  getAllAsync(): Promise<{ id: number; checksum: string }[]>;
  withExclusiveTransactionAsync(
    task: (transaction: NativeDatabaseDouble) => Promise<void>
  ): Promise<void>;
  closeAsync(): Promise<void>;
}

function nativeDatabaseDouble(options: { failMigration?: boolean } = {}): NativeDatabaseDouble {
  let userVersion = 0;
  let migrationTableExists = false;
  const migrations: { id: number; checksum: string }[] = [];

  const database: NativeDatabaseDouble = {
    execAsync: jest.fn(async (sql: string) => {
      if (options.failMigration && sql.includes('CREATE TABLE schema_migrations')) {
        throw new Error('injected migration failure');
      }
      if (sql.includes('CREATE TABLE schema_migrations')) migrationTableExists = true;
      const version = /PRAGMA user_version = (\d+);/.exec(sql);
      if (version) userVersion = Number(version[1]);
    }),
    runAsync: jest.fn(async (sql: string, params: readonly unknown[] = []) => {
      if (sql.startsWith('INSERT INTO schema_migrations')) {
        migrations.push({ id: Number(params[0]), checksum: String(params[1]) });
      }
      return { changes: 1, lastInsertRowId: 0 };
    }),
    getFirstAsync: jest.fn(async (sql: string) => {
      if (sql === 'PRAGMA user_version;') return { user_version: userVersion };
      if (sql.includes("name = 'schema_migrations'")) {
        return migrationTableExists ? { name: 'schema_migrations' } : null;
      }
      return null;
    }),
    getAllAsync: jest.fn(async () => migrations),
    withExclusiveTransactionAsync: jest.fn(
      async (task: (transaction: NativeDatabaseDouble) => Promise<void>) => task(database)
    ),
    closeAsync: jest.fn(async () => undefined),
  };
  return database;
}

describe('openSQLiteV2', () => {
  beforeEach(() => {
    mockedOpenDatabaseAsync.mockReset();
  });

  it('does not open a database merely by importing the module', () => {
    expect(mockedOpenDatabaseAsync).not.toHaveBeenCalled();
  });

  it('fails closed on web without invoking opener or fallback storage', async () => {
    const opener = jest.fn();
    await expect(openSQLiteV2({ platform: 'web', openDatabaseAsync: opener })).rejects.toEqual(
      expect.objectContaining<Partial<SQLiteV2Error>>({ code: 'capability_unavailable' })
    );
    expect(opener).not.toHaveBeenCalled();
  });

  it('opens only the side-by-side v2 database through an explicit native call', async () => {
    const database = nativeDatabaseDouble();
    mockedOpenDatabaseAsync.mockResolvedValue(database);

    const opened = await openSQLiteV2({
      platform: 'android',
      now: () => '2026-08-17T12:00:00.000Z',
    });

    expect(mockedOpenDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(mockedOpenDatabaseAsync).toHaveBeenCalledWith('clarium-v2.db');
    expect(opened.databaseName).toBe('clarium-v2.db');
    expect(opened.migration.currentVersion).toBe(1);
    await opened.closeAsync();
    expect(database.closeAsync).toHaveBeenCalledTimes(1);
  });

  it('closes the newly opened database when migration fails', async () => {
    const database = nativeDatabaseDouble({ failMigration: true });
    mockedOpenDatabaseAsync.mockResolvedValue(database);

    await expect(openSQLiteV2({ platform: 'android' })).rejects.toEqual(
      expect.objectContaining<Partial<SQLiteV2Error>>({ code: 'migration_failed' })
    );
    expect(database.closeAsync).toHaveBeenCalledTimes(1);
  });
});
