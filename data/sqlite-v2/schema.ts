export const SQLITE_V2_DATABASE_NAME = 'clarium-v2.db';
export const SQLITE_V2_SCHEMA_VERSION = 1;

export const INITIAL_SCHEMA_SQL = `
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id > 0),
  checksum TEXT NOT NULL CHECK (length(trim(checksum)) > 0),
  applied_at TEXT NOT NULL CHECK (datetime(applied_at) IS NOT NULL)
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('account', 'cash', 'card')),
  currency TEXT NOT NULL CHECK (currency IN ('BRL', 'USD', 'EUR')),
  label TEXT NOT NULL CHECK (length(trim(label)) > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL)
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  label TEXT NOT NULL CHECK (length(trim(label)) > 0),
  system INTEGER NOT NULL DEFAULT 0 CHECK (system IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL)
);

CREATE TABLE card_terms (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  card_id TEXT NOT NULL REFERENCES accounts(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK (revision > 0),
  effective_from TEXT NOT NULL CHECK (length(effective_from) = 10 AND date(effective_from) = effective_from),
  closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  cycle_rule_version TEXT NOT NULL CHECK (length(trim(cycle_rule_version)) > 0),
  time_zone TEXT NOT NULL CHECK (length(trim(time_zone)) > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  UNIQUE (card_id, revision),
  UNIQUE (card_id, effective_from)
);

CREATE TABLE statement_cycles (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  card_id TEXT NOT NULL,
  cycle_key TEXT NOT NULL CHECK (
    cycle_key GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]' AND
    substr(cycle_key, 1, 4) BETWEEN '1000' AND '9999' AND
    substr(cycle_key, 6, 2) BETWEEN '01' AND '12'
  ),
  period_starts_on TEXT NOT NULL CHECK (length(period_starts_on) = 10 AND date(period_starts_on) = period_starts_on),
  closes_on TEXT NOT NULL CHECK (length(closes_on) = 10 AND date(closes_on) = closes_on),
  due_on TEXT NOT NULL CHECK (length(due_on) = 10 AND date(due_on) = due_on),
  cycle_rule_revision INTEGER NOT NULL CHECK (cycle_rule_revision > 0),
  cycle_rule_version TEXT NOT NULL CHECK (length(trim(cycle_rule_version)) > 0),
  time_zone TEXT NOT NULL CHECK (length(trim(time_zone)) > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  FOREIGN KEY (card_id, cycle_rule_revision) REFERENCES card_terms(card_id, revision) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (card_id, cycle_key),
  CHECK (period_starts_on <= closes_on AND closes_on <= due_on)
);

CREATE TABLE movements (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'transfer')),
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0),
  occurred_on TEXT NOT NULL CHECK (length(occurred_on) = 10 AND date(occurred_on) = occurred_on),
  source_account_id TEXT REFERENCES accounts(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  destination_account_id TEXT REFERENCES accounts(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  category_id TEXT REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  statement_cycle_id TEXT REFERENCES statement_cycles(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  settles_statement_cycle_id TEXT REFERENCES statement_cycles(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  cycle_rule_revision INTEGER CHECK (cycle_rule_revision IS NULL OR cycle_rule_revision > 0),
  origin TEXT NOT NULL CHECK (origin IN ('manual', 'recurring', 'import', 'legacy')),
  description TEXT,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL),
  deleted_at TEXT CHECK (deleted_at IS NULL OR datetime(deleted_at) IS NOT NULL),
  CHECK (
    (kind = 'income' AND source_account_id IS NULL AND destination_account_id IS NOT NULL AND category_id IS NOT NULL) OR
    (kind = 'expense' AND source_account_id IS NOT NULL AND destination_account_id IS NULL AND category_id IS NOT NULL) OR
    (kind = 'transfer' AND source_account_id IS NOT NULL AND destination_account_id IS NOT NULL AND source_account_id <> destination_account_id AND category_id IS NULL)
  ),
  CHECK (statement_cycle_id IS NULL OR kind = 'expense'),
  CHECK (settles_statement_cycle_id IS NULL OR kind = 'transfer'),
  CHECK (statement_cycle_id IS NULL OR settles_statement_cycle_id IS NULL),
  CHECK ((statement_cycle_id IS NULL AND cycle_rule_revision IS NULL) OR (statement_cycle_id IS NOT NULL AND cycle_rule_revision IS NOT NULL))
);

CREATE TABLE installment_allocations (
  movement_id TEXT NOT NULL REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  installment_index INTEGER NOT NULL CHECK (installment_index BETWEEN 1 AND 36),
  installment_total INTEGER NOT NULL CHECK (installment_total BETWEEN 2 AND 36),
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0),
  statement_cycle_id TEXT NOT NULL REFERENCES statement_cycles(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  cycle_rule_revision INTEGER NOT NULL CHECK (cycle_rule_revision > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  PRIMARY KEY (movement_id, installment_index),
  CHECK (installment_index <= installment_total),
  UNIQUE (movement_id, statement_cycle_id)
);

CREATE TABLE operation_log (
  operation_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(operation_id)) > 0),
  payload_key TEXT NOT NULL CHECK (length(trim(payload_key)) > 0),
  operation_kind TEXT NOT NULL CHECK (operation_kind IN ('card_purchase', 'invoice_payment', 'movement', 'import', 'recurring_occurrence')),
  result_entity_type TEXT NOT NULL CHECK (length(trim(result_entity_type)) > 0),
  result_entity_id TEXT NOT NULL CHECK (length(trim(result_entity_id)) > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  UNIQUE (operation_id, payload_key)
);

CREATE TABLE recurring_rules (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0),
  source_account_id TEXT REFERENCES accounts(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  destination_account_id TEXT REFERENCES accounts(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0),
  day_of_month INTEGER CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 31),
  starts_on TEXT NOT NULL CHECK (length(starts_on) = 10 AND date(starts_on) = starts_on),
  ends_on TEXT CHECK (ends_on IS NULL OR (length(ends_on) = 10 AND date(ends_on) = ends_on AND ends_on >= starts_on)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL),
  CHECK (
    (kind = 'income' AND source_account_id IS NULL AND destination_account_id IS NOT NULL) OR
    (kind = 'expense' AND source_account_id IS NOT NULL AND destination_account_id IS NULL)
  )
);

CREATE TABLE recurring_occurrences (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  recurring_rule_id TEXT NOT NULL REFERENCES recurring_rules(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  month_key TEXT NOT NULL CHECK (
    month_key GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]' AND
    substr(month_key, 1, 4) BETWEEN '1000' AND '9999' AND
    substr(month_key, 6, 2) BETWEEN '01' AND '12'
  ),
  state TEXT NOT NULL CHECK (state IN ('planned', 'confirmed', 'ignored')),
  movement_id TEXT UNIQUE REFERENCES movements(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  UNIQUE (recurring_rule_id, month_key),
  CHECK (
    (state = 'confirmed' AND movement_id IS NOT NULL) OR
    (state IN ('planned', 'ignored') AND movement_id IS NULL)
  )
);

CREATE TABLE budgets (
  month_key TEXT PRIMARY KEY NOT NULL CHECK (
    month_key GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]' AND
    substr(month_key, 1, 4) BETWEEN '1000' AND '9999' AND
    substr(month_key, 6, 2) BETWEEN '01' AND '12'
  ),
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL)
);

CREATE TABLE budget_category_limits (
  month_key TEXT NOT NULL REFERENCES budgets(month_key) ON UPDATE RESTRICT ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0),
  PRIMARY KEY (month_key, category_id)
);

CREATE TABLE trash_batches (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  deleted_at TEXT NOT NULL CHECK (datetime(deleted_at) IS NOT NULL),
  purge_after TEXT NOT NULL CHECK (datetime(purge_after) IS NOT NULL AND purge_after >= deleted_at),
  restored_at TEXT CHECK (restored_at IS NULL OR datetime(restored_at) IS NOT NULL)
);

CREATE TABLE trash_entries (
  batch_id TEXT NOT NULL REFERENCES trash_batches(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('movement', 'recurring_rule', 'budget')),
  entity_id TEXT NOT NULL CHECK (length(trim(entity_id)) > 0),
  PRIMARY KEY (batch_id, entity_type, entity_id)
);

CREATE TABLE migration_state (
  singleton_id INTEGER PRIMARY KEY NOT NULL DEFAULT 1 CHECK (singleton_id = 1),
  state TEXT NOT NULL CHECK (state IN ('legacy_primary', 'copying', 'verifying', 'v2_primary', 'blocked')),
  checkpoint_id TEXT,
  source_manifest_hash TEXT,
  reconciliation_hash TEXT,
  lock_token_hash TEXT,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL)
);

CREATE TABLE migration_id_map (
  source TEXT NOT NULL CHECK (length(trim(source)) > 0),
  legacy_id TEXT NOT NULL CHECK (length(trim(legacy_id)) > 0),
  entity_type TEXT NOT NULL CHECK (length(trim(entity_type)) > 0),
  v2_id TEXT NOT NULL CHECK (length(trim(v2_id)) > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  PRIMARY KEY (source, legacy_id, entity_type),
  UNIQUE (entity_type, v2_id)
);

CREATE TABLE migration_conflicts (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('possible_duplicate', 'invalid_value', 'missing_relation', 'unrepresentable')),
  state TEXT NOT NULL CHECK (state IN ('unresolved', 'keep_both', 'merge')),
  source_refs_hash TEXT NOT NULL CHECK (length(trim(source_refs_hash)) > 0),
  decision_hash TEXT,
  decided_by TEXT CHECK (decided_by IS NULL OR decided_by IN ('user', 'migration-review')),
  reason_code TEXT,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  resolved_at TEXT CHECK (resolved_at IS NULL OR datetime(resolved_at) IS NOT NULL),
  CHECK (
    (state = 'unresolved' AND decision_hash IS NULL AND decided_by IS NULL AND resolved_at IS NULL) OR
    (state IN ('keep_both', 'merge') AND decision_hash IS NOT NULL AND decided_by IS NOT NULL AND resolved_at IS NOT NULL)
  )
);

CREATE TABLE import_batches (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  fingerprint TEXT NOT NULL CHECK (length(trim(fingerprint)) > 0),
  mapping_hash TEXT NOT NULL CHECK (length(trim(mapping_hash)) > 0),
  importer_version TEXT NOT NULL CHECK (length(trim(importer_version)) > 0),
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  state TEXT NOT NULL CHECK (state IN ('preview', 'committed', 'cancelled', 'failed')),
  preview_token_hash TEXT NOT NULL CHECK (length(trim(preview_token_hash)) > 0),
  accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
  rejected_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  completed_at TEXT CHECK (completed_at IS NULL OR datetime(completed_at) IS NOT NULL),
  UNIQUE (fingerprint, mapping_hash, importer_version, schema_version)
);

CREATE TABLE notification_preferences (
  singleton_id INTEGER PRIMARY KEY NOT NULL DEFAULT 1 CHECK (singleton_id = 1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  time_zone TEXT NOT NULL CHECK (length(trim(time_zone)) > 0),
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version > 0),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL),
  CHECK ((quiet_hours_start IS NULL) = (quiet_hours_end IS NULL))
);

CREATE TABLE notification_schedules (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
  logical_key TEXT NOT NULL UNIQUE CHECK (length(trim(logical_key)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('invoice_due', 'budget', 'recurring')),
  reference_id TEXT NOT NULL CHECK (length(trim(reference_id)) > 0),
  scheduled_for TEXT NOT NULL CHECK (datetime(scheduled_for) IS NOT NULL),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'delivered', 'cancelled', 'failed')),
  platform_notification_id TEXT,
  created_at TEXT NOT NULL CHECK (datetime(created_at) IS NOT NULL),
  updated_at TEXT NOT NULL CHECK (datetime(updated_at) IS NOT NULL)
);

CREATE TRIGGER card_terms_require_card
BEFORE INSERT ON card_terms
FOR EACH ROW WHEN (SELECT kind FROM accounts WHERE id = NEW.card_id) <> 'card'
BEGIN
  SELECT RAISE(ABORT, 'card_terms_require_card');
END;

CREATE TRIGGER accounts_kind_preserves_card_links
BEFORE UPDATE OF kind ON accounts
FOR EACH ROW WHEN NEW.kind <> 'card' AND (
  EXISTS (SELECT 1 FROM card_terms WHERE card_id = OLD.id) OR
  EXISTS (SELECT 1 FROM statement_cycles WHERE card_id = OLD.id)
)
BEGIN
  SELECT RAISE(ABORT, 'accounts_kind_preserves_card_links');
END;

CREATE TRIGGER accounts_currency_preserves_transfers
BEFORE UPDATE OF currency ON accounts
FOR EACH ROW WHEN EXISTS (
  SELECT 1
  FROM movements
  JOIN accounts AS counterpart ON counterpart.id = CASE
    WHEN movements.source_account_id = OLD.id THEN movements.destination_account_id
    ELSE movements.source_account_id
  END
  WHERE movements.kind = 'transfer'
    AND (movements.source_account_id = OLD.id OR movements.destination_account_id = OLD.id)
    AND counterpart.currency <> NEW.currency
)
BEGIN
  SELECT RAISE(ABORT, 'accounts_currency_preserves_transfers');
END;

CREATE TRIGGER categories_kind_preserves_references
BEFORE UPDATE OF kind ON categories
FOR EACH ROW WHEN EXISTS (
  SELECT 1 FROM movements
  WHERE category_id = OLD.id AND kind <> NEW.kind
) OR EXISTS (
  SELECT 1 FROM recurring_rules
  WHERE category_id = OLD.id AND kind <> NEW.kind
)
BEGIN
  SELECT RAISE(ABORT, 'categories_kind_preserves_references');
END;

CREATE TRIGGER card_terms_require_card_on_update
BEFORE UPDATE OF card_id ON card_terms
FOR EACH ROW WHEN (SELECT kind FROM accounts WHERE id = NEW.card_id) <> 'card'
BEGIN
  SELECT RAISE(ABORT, 'card_terms_require_card');
END;

CREATE TRIGGER statement_cycles_require_card
BEFORE INSERT ON statement_cycles
FOR EACH ROW WHEN (SELECT kind FROM accounts WHERE id = NEW.card_id) <> 'card'
BEGIN
  SELECT RAISE(ABORT, 'statement_cycles_require_card');
END;

CREATE TRIGGER statement_cycles_require_card_on_update
BEFORE UPDATE OF card_id ON statement_cycles
FOR EACH ROW WHEN (SELECT kind FROM accounts WHERE id = NEW.card_id) <> 'card'
BEGIN
  SELECT RAISE(ABORT, 'statement_cycles_require_card');
END;

CREATE TRIGGER statement_cycles_identity_preserves_dependents
BEFORE UPDATE OF card_id, cycle_rule_revision ON statement_cycles
FOR EACH ROW WHEN EXISTS (
  SELECT 1 FROM movements
  WHERE statement_cycle_id = OLD.id OR settles_statement_cycle_id = OLD.id
) OR EXISTS (
  SELECT 1 FROM installment_allocations WHERE statement_cycle_id = OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'statement_cycles_identity_preserves_dependents');
END;

CREATE TRIGGER movements_require_compatible_category
BEFORE INSERT ON movements
FOR EACH ROW WHEN NEW.category_id IS NOT NULL AND
  (SELECT kind FROM categories WHERE id = NEW.category_id) <> NEW.kind
BEGIN
  SELECT RAISE(ABORT, 'movements_require_compatible_category');
END;

CREATE TRIGGER movements_require_compatible_category_on_update
BEFORE UPDATE OF kind, category_id ON movements
FOR EACH ROW WHEN NEW.category_id IS NOT NULL AND
  (SELECT kind FROM categories WHERE id = NEW.category_id) <> NEW.kind
BEGIN
  SELECT RAISE(ABORT, 'movements_require_compatible_category');
END;

CREATE TRIGGER transfers_require_same_currency
BEFORE INSERT ON movements
FOR EACH ROW WHEN NEW.kind = 'transfer' AND
  (SELECT currency FROM accounts WHERE id = NEW.source_account_id) <>
  (SELECT currency FROM accounts WHERE id = NEW.destination_account_id)
BEGIN
  SELECT RAISE(ABORT, 'transfers_require_same_currency');
END;

CREATE TRIGGER transfers_require_same_currency_on_update
BEFORE UPDATE OF kind, source_account_id, destination_account_id ON movements
FOR EACH ROW WHEN NEW.kind = 'transfer' AND
  (SELECT currency FROM accounts WHERE id = NEW.source_account_id) <>
  (SELECT currency FROM accounts WHERE id = NEW.destination_account_id)
BEGIN
  SELECT RAISE(ABORT, 'transfers_require_same_currency');
END;

CREATE TRIGGER movements_purchase_cycle_matches_card
BEFORE INSERT ON movements
FOR EACH ROW WHEN NEW.statement_cycle_id IS NOT NULL AND (
  NEW.source_account_id <> (SELECT card_id FROM statement_cycles WHERE id = NEW.statement_cycle_id) OR
  NEW.cycle_rule_revision <> (SELECT cycle_rule_revision FROM statement_cycles WHERE id = NEW.statement_cycle_id) OR
  (SELECT kind FROM accounts WHERE id = NEW.source_account_id) <> 'card'
)
BEGIN
  SELECT RAISE(ABORT, 'movements_purchase_cycle_matches_card');
END;

CREATE TRIGGER movements_purchase_cycle_matches_card_on_update
BEFORE UPDATE OF source_account_id, statement_cycle_id, cycle_rule_revision ON movements
FOR EACH ROW WHEN NEW.statement_cycle_id IS NOT NULL AND (
  NEW.source_account_id <> (SELECT card_id FROM statement_cycles WHERE id = NEW.statement_cycle_id) OR
  NEW.cycle_rule_revision <> (SELECT cycle_rule_revision FROM statement_cycles WHERE id = NEW.statement_cycle_id) OR
  (SELECT kind FROM accounts WHERE id = NEW.source_account_id) <> 'card'
)
BEGIN
  SELECT RAISE(ABORT, 'movements_purchase_cycle_matches_card');
END;

CREATE TRIGGER movements_payment_cycle_matches_card
BEFORE INSERT ON movements
FOR EACH ROW WHEN NEW.settles_statement_cycle_id IS NOT NULL AND (
  NEW.destination_account_id <> (SELECT card_id FROM statement_cycles WHERE id = NEW.settles_statement_cycle_id) OR
  (SELECT kind FROM accounts WHERE id = NEW.destination_account_id) <> 'card'
)
BEGIN
  SELECT RAISE(ABORT, 'movements_payment_cycle_matches_card');
END;

CREATE TRIGGER movements_payment_cycle_matches_card_on_update
BEFORE UPDATE OF destination_account_id, settles_statement_cycle_id ON movements
FOR EACH ROW WHEN NEW.settles_statement_cycle_id IS NOT NULL AND (
  NEW.destination_account_id <> (SELECT card_id FROM statement_cycles WHERE id = NEW.settles_statement_cycle_id) OR
  (SELECT kind FROM accounts WHERE id = NEW.destination_account_id) <> 'card'
)
BEGIN
  SELECT RAISE(ABORT, 'movements_payment_cycle_matches_card');
END;

CREATE TRIGGER installment_allocations_require_card_expense
BEFORE INSERT ON installment_allocations
FOR EACH ROW WHEN
  (SELECT kind FROM movements WHERE id = NEW.movement_id) <> 'expense' OR
  (SELECT accounts.kind FROM movements JOIN accounts ON accounts.id = movements.source_account_id WHERE movements.id = NEW.movement_id) <> 'card' OR
  (SELECT source_account_id FROM movements WHERE id = NEW.movement_id) <> (SELECT card_id FROM statement_cycles WHERE id = NEW.statement_cycle_id) OR
  NEW.cycle_rule_revision <> (SELECT cycle_rule_revision FROM statement_cycles WHERE id = NEW.statement_cycle_id)
BEGIN
  SELECT RAISE(ABORT, 'installment_allocations_require_card_expense');
END;

CREATE TRIGGER installment_allocations_require_card_expense_on_update
BEFORE UPDATE OF movement_id, statement_cycle_id, cycle_rule_revision ON installment_allocations
FOR EACH ROW WHEN
  (SELECT kind FROM movements WHERE id = NEW.movement_id) <> 'expense' OR
  (SELECT accounts.kind FROM movements JOIN accounts ON accounts.id = movements.source_account_id WHERE movements.id = NEW.movement_id) <> 'card' OR
  (SELECT source_account_id FROM movements WHERE id = NEW.movement_id) <> (SELECT card_id FROM statement_cycles WHERE id = NEW.statement_cycle_id) OR
  NEW.cycle_rule_revision <> (SELECT cycle_rule_revision FROM statement_cycles WHERE id = NEW.statement_cycle_id)
BEGIN
  SELECT RAISE(ABORT, 'installment_allocations_require_card_expense');
END;

CREATE INDEX idx_card_terms_card_effective ON card_terms (card_id, effective_from DESC);
CREATE INDEX idx_statement_cycles_card_due ON statement_cycles (card_id, due_on);
CREATE INDEX idx_movements_occurred_on ON movements (occurred_on);
CREATE INDEX idx_movements_source_occurred ON movements (source_account_id, occurred_on);
CREATE INDEX idx_movements_destination_occurred ON movements (destination_account_id, occurred_on);
CREATE INDEX idx_movements_category_occurred ON movements (category_id, occurred_on);
CREATE INDEX idx_movements_statement_cycle ON movements (statement_cycle_id);
CREATE INDEX idx_movements_settles_statement_cycle ON movements (settles_statement_cycle_id);
CREATE INDEX idx_movements_deleted_at ON movements (deleted_at);
CREATE INDEX idx_installment_allocations_cycle ON installment_allocations (statement_cycle_id);
CREATE INDEX idx_recurring_occurrences_month ON recurring_occurrences (month_key);
CREATE INDEX idx_trash_batches_purge_after ON trash_batches (purge_after);
CREATE INDEX idx_migration_conflicts_state ON migration_conflicts (state, kind);
CREATE INDEX idx_import_batches_state ON import_batches (state, created_at);
CREATE INDEX idx_notification_schedules_status_time ON notification_schedules (status, scheduled_for);
`;

export function deterministicSqlChecksum(sql: string): string {
  const normalized = sql.replace(/\s+/g, ' ').trim();
  let hash = 0x811c9dc5;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${normalized.length}:${hash.toString(16).padStart(8, '0')}`;
}

export const INITIAL_SCHEMA_CHECKSUM = deterministicSqlChecksum(INITIAL_SCHEMA_SQL);
