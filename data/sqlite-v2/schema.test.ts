import {
  INITIAL_SCHEMA_CHECKSUM,
  INITIAL_SCHEMA_SQL,
  SQLITE_V2_DATABASE_NAME,
  SQLITE_V2_SCHEMA_VERSION,
  deterministicSqlChecksum,
} from '@/data/sqlite-v2';

const EXPECTED_TABLES = [
  'accounts',
  'budget_category_limits',
  'budgets',
  'card_terms',
  'categories',
  'import_batches',
  'installment_allocations',
  'migration_conflicts',
  'migration_id_map',
  'migration_state',
  'movements',
  'notification_preferences',
  'notification_schedules',
  'operation_log',
  'recurring_occurrences',
  'recurring_rules',
  'schema_migrations',
  'statement_cycles',
  'trash_batches',
  'trash_entries',
];

describe('SQLite v2 schema contract', () => {
  it('uses a separate database and deterministic version/checksum', () => {
    expect(SQLITE_V2_DATABASE_NAME).toBe('clarium-v2.db');
    expect(SQLITE_V2_SCHEMA_VERSION).toBe(1);
    expect(INITIAL_SCHEMA_CHECKSUM).toBe(deterministicSqlChecksum(INITIAL_SCHEMA_SQL));
    expect(INITIAL_SCHEMA_CHECKSUM).toMatch(/^fnv1a32:\d+:[0-9a-f]{8}$/);
    expect(deterministicSqlChecksum(`\n${INITIAL_SCHEMA_SQL}\n`)).toBe(INITIAL_SCHEMA_CHECKSUM);
  });

  it('declares the complete v2 table set', () => {
    const tables = [...INITIAL_SCHEMA_SQL.matchAll(/CREATE TABLE (\w+)/g)]
      .map((match) => match[1])
      .sort();
    expect(tables).toEqual(EXPECTED_TABLES.sort());
  });

  it('enforces positive integer minor units and the movement endpoint matrix', () => {
    expect(INITIAL_SCHEMA_SQL).toContain(
      "amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0)"
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      "kind = 'income' AND source_account_id IS NULL AND destination_account_id IS NOT NULL AND category_id IS NOT NULL"
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      "kind = 'expense' AND source_account_id IS NOT NULL AND destination_account_id IS NULL AND category_id IS NOT NULL"
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      "kind = 'transfer' AND source_account_id IS NOT NULL AND destination_account_id IS NOT NULL AND source_account_id <> destination_account_id AND category_id IS NULL"
    );
    expect(INITIAL_SCHEMA_SQL).toContain('transfers_require_same_currency');
    expect(INITIAL_SCHEMA_SQL).toContain('movements_require_compatible_category');
  });

  it('constrains cards, installments, idempotency and recurrence', () => {
    expect(INITIAL_SCHEMA_SQL).toContain('card_terms_require_card');
    expect(INITIAL_SCHEMA_SQL).toContain('statement_cycles_require_card');
    expect(INITIAL_SCHEMA_SQL).toContain('accounts_kind_preserves_card_links');
    expect(INITIAL_SCHEMA_SQL).toContain('accounts_currency_preserves_transfers');
    expect(INITIAL_SCHEMA_SQL).toContain('categories_kind_preserves_references');
    expect(INITIAL_SCHEMA_SQL).toContain('statement_cycles_identity_preserves_dependents');
    expect(INITIAL_SCHEMA_SQL).toContain('installment_total BETWEEN 2 AND 36');
    expect(INITIAL_SCHEMA_SQL).toContain('installment_index <= installment_total');
    expect(INITIAL_SCHEMA_SQL).toContain('installment_allocations_require_card_expense');
    expect(INITIAL_SCHEMA_SQL).toContain(
      'NEW.cycle_rule_revision <> (SELECT cycle_rule_revision FROM statement_cycles WHERE id = NEW.statement_cycle_id)'
    );
    expect(INITIAL_SCHEMA_SQL).toContain('operation_id TEXT PRIMARY KEY NOT NULL');
    expect(INITIAL_SCHEMA_SQL).toContain('UNIQUE (operation_id, payload_key)');
    expect(INITIAL_SCHEMA_SQL).toContain('UNIQUE (recurring_rule_id, month_key)');
    expect(INITIAL_SCHEMA_SQL).toContain("state TEXT NOT NULL CHECK (state IN ('planned', 'confirmed', 'ignored'))");
    expect(INITIAL_SCHEMA_SQL).toContain("state = 'confirmed' AND movement_id IS NOT NULL");
    expect(INITIAL_SCHEMA_SQL).toContain("state IN ('planned', 'ignored') AND movement_id IS NULL");
    expect(INITIAL_SCHEMA_SQL).toContain("substr(month_key, 6, 2) BETWEEN '01' AND '12'");
    expect(INITIAL_SCHEMA_SQL).toContain("substr(cycle_key, 6, 2) BETWEEN '01' AND '12'");
    expect(INITIAL_SCHEMA_SQL).toContain("substr(month_key, 1, 4) BETWEEN '1000' AND '9999'");
    expect(INITIAL_SCHEMA_SQL).toContain("substr(cycle_key, 1, 4) BETWEEN '1000' AND '9999'");
  });

  it('separates purchase assignment from invoice-payment settlement', () => {
    expect(INITIAL_SCHEMA_SQL).toContain(
      'settles_statement_cycle_id TEXT REFERENCES statement_cycles(id)'
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      "CHECK (settles_statement_cycle_id IS NULL OR kind = 'transfer')"
    );
    expect(INITIAL_SCHEMA_SQL).toContain('movements_purchase_cycle_matches_card');
    expect(INITIAL_SCHEMA_SQL).toContain('movements_payment_cycle_matches_card');
    expect(INITIAL_SCHEMA_SQL).toContain('BEFORE UPDATE OF kind, category_id ON movements');
    expect(INITIAL_SCHEMA_SQL).toContain(
      'BEFORE UPDATE OF kind, source_account_id, destination_account_id ON movements'
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      'BEFORE UPDATE OF source_account_id, statement_cycle_id, cycle_rule_revision ON movements'
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      'BEFORE UPDATE OF destination_account_id, settles_statement_cycle_id ON movements'
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      'BEFORE UPDATE OF movement_id, statement_cycle_id, cycle_rule_revision ON installment_allocations'
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      'NEW.source_account_id <> (SELECT card_id FROM statement_cycles WHERE id = NEW.statement_cycle_id)'
    );
    expect(INITIAL_SCHEMA_SQL).toContain(
      'NEW.destination_account_id <> (SELECT card_id FROM statement_cycles WHERE id = NEW.settles_statement_cycle_id)'
    );
  });

  it('keeps budgets positive, trash re-deletable and notification schedules idempotent', () => {
    expect(INITIAL_SCHEMA_SQL.match(/amount_minor > 0/g)?.length).toBeGreaterThanOrEqual(5);
    expect(INITIAL_SCHEMA_SQL).not.toContain('UNIQUE (entity_type, entity_id)');
    expect(INITIAL_SCHEMA_SQL).toContain(
      'logical_key TEXT NOT NULL UNIQUE CHECK (length(trim(logical_key)) > 0)'
    );
    expect(INITIAL_SCHEMA_SQL).not.toContain('UNIQUE (kind, reference_id, scheduled_for)');
  });

  it('declares foreign keys and indices for relation and projection paths', () => {
    expect(INITIAL_SCHEMA_SQL.match(/REFERENCES /g)?.length).toBeGreaterThanOrEqual(16);
    expect(INITIAL_SCHEMA_SQL.match(/CREATE INDEX /g)?.length).toBeGreaterThanOrEqual(12);
    expect(INITIAL_SCHEMA_SQL).toContain('idx_movements_statement_cycle');
    expect(INITIAL_SCHEMA_SQL).toContain('idx_movements_settles_statement_cycle');
    expect(INITIAL_SCHEMA_SQL).toContain('idx_migration_conflicts_state');
    expect(INITIAL_SCHEMA_SQL).toContain('idx_notification_schedules_status_time');
  });
});
