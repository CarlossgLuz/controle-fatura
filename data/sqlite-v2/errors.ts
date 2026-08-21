export type SQLiteV2ErrorCode =
  | 'capability_unavailable'
  | 'schema_newer'
  | 'schema_checksum_mismatch'
  | 'schema_incompatible'
  | 'migration_failed';

export class SQLiteV2Error extends Error {
  constructor(
    readonly code: SQLiteV2ErrorCode,
    options?: { cause?: unknown }
  ) {
    super(code, options);
    this.name = 'SQLiteV2Error';
  }
}
