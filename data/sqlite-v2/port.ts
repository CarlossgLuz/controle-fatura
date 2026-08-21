export type SQLiteV2BindValue = string | number | null;
export type SQLiteV2BindParams = readonly SQLiteV2BindValue[];

export interface SQLiteV2RunResult {
  readonly changes: number;
  readonly lastInsertRowId: number;
}

export interface SQLiteV2ExecutorPort {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SQLiteV2BindParams): Promise<SQLiteV2RunResult>;
  getFirstAsync<T>(sql: string, params?: SQLiteV2BindParams): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SQLiteV2BindParams): Promise<T[]>;
}

export interface SQLiteV2DatabasePort extends SQLiteV2ExecutorPort {
  withExclusiveTransactionAsync(
    task: (transaction: SQLiteV2ExecutorPort) => Promise<void>
  ): Promise<void>;
}
