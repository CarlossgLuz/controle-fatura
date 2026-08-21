import {
  INITIAL_SCHEMA_CHECKSUM,
  SQLiteV2Error,
  migrateSQLiteV2,
  type AppliedSQLiteV2Migration,
  type SQLiteV2BindParams,
  type SQLiteV2DatabasePort,
  type SQLiteV2RunResult,
} from '@/data/sqlite-v2';

interface FakeDatabaseOptions {
  readonly userVersion?: number;
  readonly migrationTableExists?: boolean;
  readonly migrations?: readonly AppliedSQLiteV2Migration[];
  readonly failSqlContaining?: string;
}

class FakeDatabase implements SQLiteV2DatabasePort {
  userVersion: number;
  migrationTableExists: boolean;
  migrations: AppliedSQLiteV2Migration[];
  readonly execCalls: string[] = [];
  readonly runCalls: { sql: string; params: SQLiteV2BindParams }[] = [];
  exclusiveTransactions = 0;
  rollbacks = 0;

  constructor(private readonly options: FakeDatabaseOptions = {}) {
    this.userVersion = options.userVersion ?? 0;
    this.migrationTableExists = options.migrationTableExists ?? false;
    this.migrations = [...(options.migrations ?? [])];
  }

  async execAsync(sql: string): Promise<void> {
    this.execCalls.push(sql);
    if (this.options.failSqlContaining && sql.includes(this.options.failSqlContaining)) {
      throw new Error('injected migration failure');
    }
    if (sql.includes('CREATE TABLE schema_migrations')) this.migrationTableExists = true;
    const version = /PRAGMA user_version = (\d+);/.exec(sql);
    if (version) this.userVersion = Number(version[1]);
  }

  async runAsync(sql: string, params: SQLiteV2BindParams = []): Promise<SQLiteV2RunResult> {
    this.runCalls.push({ sql, params });
    if (sql.startsWith('INSERT INTO schema_migrations')) {
      this.migrations.push({ id: Number(params[0]), checksum: String(params[1]) });
    }
    return { changes: 1, lastInsertRowId: 0 };
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (sql === 'PRAGMA user_version;') {
      return { user_version: this.userVersion } as T;
    }
    if (sql.includes("name = 'schema_migrations'")) {
      return (this.migrationTableExists ? { name: 'schema_migrations' } : null) as T | null;
    }
    return null;
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    if (sql.startsWith('SELECT id, checksum FROM schema_migrations')) {
      return [...this.migrations].sort((left, right) => left.id - right.id) as T[];
    }
    return [];
  }

  async withExclusiveTransactionAsync(
    task: (transaction: SQLiteV2DatabasePort) => Promise<void>
  ): Promise<void> {
    this.exclusiveTransactions += 1;
    const snapshot = {
      userVersion: this.userVersion,
      migrationTableExists: this.migrationTableExists,
      migrations: [...this.migrations],
    };
    try {
      await task(this);
    } catch (error) {
      this.userVersion = snapshot.userVersion;
      this.migrationTableExists = snapshot.migrationTableExists;
      this.migrations = snapshot.migrations;
      this.rollbacks += 1;
      throw error;
    }
  }
}

function expectSQLiteV2Error(action: () => Promise<unknown>, code: SQLiteV2Error['code']) {
  return expect(action()).rejects.toEqual(expect.objectContaining({ code }));
}

describe('migrateSQLiteV2', () => {
  it('configures the connection and applies first-run schema atomically', async () => {
    const database = new FakeDatabase();
    const result = await migrateSQLiteV2(database, { now: () => '2026-08-17T12:00:00.000Z' });

    expect(database.execCalls.slice(0, 2)).toEqual([
      'PRAGMA foreign_keys = ON;',
      'PRAGMA journal_mode = WAL;',
    ]);
    expect(database.exclusiveTransactions).toBe(1);
    expect(database.userVersion).toBe(1);
    expect(database.migrationTableExists).toBe(true);
    expect(database.migrations).toEqual([{ id: 1, checksum: INITIAL_SCHEMA_CHECKSUM }]);
    expect(database.runCalls[0].params).toEqual([
      1,
      INITIAL_SCHEMA_CHECKSUM,
      '2026-08-17T12:00:00.000Z',
    ]);
    expect(result).toEqual({ previousVersion: 0, currentVersion: 1, appliedMigrationIds: [1] });
  });

  it('replays without DDL or duplicate migration records', async () => {
    const database = new FakeDatabase({
      userVersion: 1,
      migrationTableExists: true,
      migrations: [{ id: 1, checksum: INITIAL_SCHEMA_CHECKSUM }],
    });
    const result = await migrateSQLiteV2(database);

    expect(database.exclusiveTransactions).toBe(0);
    expect(database.runCalls).toHaveLength(0);
    expect(database.migrations).toHaveLength(1);
    expect(result).toEqual({ previousVersion: 1, currentVersion: 1, appliedMigrationIds: [] });
  });

  it('rejects a divergent checksum without writing', async () => {
    const database = new FakeDatabase({
      userVersion: 1,
      migrationTableExists: true,
      migrations: [{ id: 1, checksum: 'different' }],
    });

    await expectSQLiteV2Error(() => migrateSQLiteV2(database), 'schema_checksum_mismatch');
    expect(database.exclusiveTransactions).toBe(0);
    expect(database.runCalls).toHaveLength(0);
  });

  it('rejects a database newer than the adapter', async () => {
    const database = new FakeDatabase({ userVersion: 2 });

    await expectSQLiteV2Error(() => migrateSQLiteV2(database), 'schema_newer');
    expect(database.exclusiveTransactions).toBe(0);
  });

  it('rejects a version pointer without schema_migrations evidence', async () => {
    const database = new FakeDatabase({ userVersion: 1, migrationTableExists: false });
    await expectSQLiteV2Error(() => migrateSQLiteV2(database), 'schema_incompatible');
  });

  it('rejects an unexpected migration table at version zero', async () => {
    const database = new FakeDatabase({ userVersion: 0, migrationTableExists: true });
    await expectSQLiteV2Error(() => migrateSQLiteV2(database), 'schema_incompatible');
  });

  it('rolls back every schema effect when migration SQL fails', async () => {
    const database = new FakeDatabase({ failSqlContaining: 'CREATE TABLE categories' });

    await expectSQLiteV2Error(() => migrateSQLiteV2(database), 'migration_failed');
    expect(database.exclusiveTransactions).toBe(1);
    expect(database.rollbacks).toBe(1);
    expect(database.userVersion).toBe(0);
    expect(database.migrationTableExists).toBe(false);
    expect(database.migrations).toHaveLength(0);
  });
});
