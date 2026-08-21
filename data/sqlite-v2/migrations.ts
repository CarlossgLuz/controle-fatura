import { SQLiteV2Error } from '@/data/sqlite-v2/errors';
import type { SQLiteV2DatabasePort } from '@/data/sqlite-v2/port';
import {
  INITIAL_SCHEMA_CHECKSUM,
  INITIAL_SCHEMA_SQL,
  SQLITE_V2_SCHEMA_VERSION,
} from '@/data/sqlite-v2/schema';

export interface SQLiteV2Migration {
  readonly id: number;
  readonly checksum: string;
  readonly sql: string;
}

export interface AppliedSQLiteV2Migration {
  readonly id: number;
  readonly checksum: string;
}

export interface SQLiteV2MigrationResult {
  readonly previousVersion: number;
  readonly currentVersion: number;
  readonly appliedMigrationIds: readonly number[];
}

export interface SQLiteV2MigrationOptions {
  readonly now?: () => string;
}

export const SQLITE_V2_MIGRATIONS: readonly SQLiteV2Migration[] = Object.freeze([
  Object.freeze({ id: 1, checksum: INITIAL_SCHEMA_CHECKSUM, sql: INITIAL_SCHEMA_SQL }),
]);

const READ_USER_VERSION_SQL = 'PRAGMA user_version;';
const ENABLE_FOREIGN_KEYS_SQL = 'PRAGMA foreign_keys = ON;';
const ENABLE_WAL_SQL = 'PRAGMA journal_mode = WAL;';
const HAS_MIGRATION_TABLE_SQL =
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations';";
const READ_MIGRATIONS_SQL =
  'SELECT id, checksum FROM schema_migrations ORDER BY id ASC;';
const INSERT_MIGRATION_SQL =
  'INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?);';

function migrationById(id: number): SQLiteV2Migration | undefined {
  return SQLITE_V2_MIGRATIONS.find((migration) => migration.id === id);
}

function assertVersion(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new SQLiteV2Error('schema_incompatible');
  }
  return value as number;
}

function validateAppliedMigrations(
  currentVersion: number,
  migrationTableExists: boolean,
  applied: readonly AppliedSQLiteV2Migration[]
): void {
  const highestApplied = applied.reduce((highest, migration) => Math.max(highest, migration.id), 0);
  if (currentVersion > SQLITE_V2_SCHEMA_VERSION || highestApplied > SQLITE_V2_SCHEMA_VERSION) {
    throw new SQLiteV2Error('schema_newer');
  }
  if (currentVersion > 0 && !migrationTableExists) {
    throw new SQLiteV2Error('schema_incompatible');
  }
  if (currentVersion === 0 && migrationTableExists) {
    throw new SQLiteV2Error('schema_incompatible');
  }
  if (highestApplied !== currentVersion || applied.length !== currentVersion) {
    throw new SQLiteV2Error('schema_incompatible');
  }

  for (let expectedId = 1; expectedId <= currentVersion; expectedId += 1) {
    const record = applied[expectedId - 1];
    const expected = migrationById(expectedId);
    if (!record || record.id !== expectedId || !expected) {
      throw new SQLiteV2Error('schema_incompatible');
    }
    if (record.checksum !== expected.checksum) {
      throw new SQLiteV2Error('schema_checksum_mismatch');
    }
  }
}

export async function migrateSQLiteV2(
  database: SQLiteV2DatabasePort,
  options: SQLiteV2MigrationOptions = {}
): Promise<SQLiteV2MigrationResult> {
  await database.execAsync(ENABLE_FOREIGN_KEYS_SQL);
  await database.execAsync(ENABLE_WAL_SQL);

  const versionRow = await database.getFirstAsync<{ user_version: number }>(READ_USER_VERSION_SQL);
  const previousVersion = assertVersion(versionRow?.user_version ?? 0);
  if (previousVersion > SQLITE_V2_SCHEMA_VERSION) {
    throw new SQLiteV2Error('schema_newer');
  }

  const migrationTable = await database.getFirstAsync<{ name: string }>(HAS_MIGRATION_TABLE_SQL);
  const migrationTableExists = migrationTable?.name === 'schema_migrations';
  const applied = migrationTableExists
    ? await database.getAllAsync<AppliedSQLiteV2Migration>(READ_MIGRATIONS_SQL)
    : [];
  validateAppliedMigrations(previousVersion, migrationTableExists, applied);

  const pending = SQLITE_V2_MIGRATIONS.filter(({ id }) => id > previousVersion);
  if (pending.length === 0) {
    return Object.freeze({
      previousVersion,
      currentVersion: previousVersion,
      appliedMigrationIds: Object.freeze([] as number[]),
    });
  }

  const appliedMigrationIds: number[] = [];
  const now = options.now ?? (() => new Date().toISOString());
  try {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      for (const migration of pending) {
        await transaction.execAsync(migration.sql);
        await transaction.runAsync(INSERT_MIGRATION_SQL, [
          migration.id,
          migration.checksum,
          now(),
        ]);
        await transaction.execAsync(`PRAGMA user_version = ${migration.id};`);
        appliedMigrationIds.push(migration.id);
      }
    });
  } catch (error) {
    if (error instanceof SQLiteV2Error) throw error;
    throw new SQLiteV2Error('migration_failed', { cause: error });
  }

  return Object.freeze({
    previousVersion,
    currentVersion: SQLITE_V2_SCHEMA_VERSION,
    appliedMigrationIds: Object.freeze([...appliedMigrationIds]),
  });
}
