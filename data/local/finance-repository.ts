import AsyncStorage from 'expo-sqlite/kv-store';

import {
  DEFAULT_CATEGORIES,
  createBudgetConfig,
  createInstallmentTransactions,
  createRecurringEntry,
  createTransaction,
  editBudgetConfig,
  editCardConfig,
  editRecurringEntry,
  editTransaction,
} from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
import { devWarn } from '@/utils/logger';
import type {
  BudgetConfig,
  CardConfig,
  EditRecurringEntryInput,
  EditTransactionInput,
  MonthKey,
  NewRecurringEntryInput,
  NewTransactionInput,
  Category,
  RecurringEntry,
  Transaction,
  TransactionInstallment,
} from '@/domain/finance/types';

const TRANSACTIONS_KEY = 'finance.transactions.v1';
const RECURRING_KEY = 'finance.recurring.v1';
const BUDGET_KEY = 'finance.budget.v1';
const CARD_CONFIG_KEY = 'finance.card-config.v1';
const CUSTOM_CATEGORIES_KEY = 'finance.categories.v1';
const INACTIVE_SYSTEM_CATEGORIES_KEY = 'finance.categories.system.inactive.v1';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function isIsoDate(value: unknown): value is `${number}-${number}-${number}` {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMonthKey(value: unknown): value is `${number}-${number}` {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 10;
}

function sanitizeInstallment(raw: unknown): TransactionInstallment | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const entry = raw as Partial<TransactionInstallment>;

  if (
    typeof entry.groupId !== 'string' ||
    !entry.groupId ||
    typeof entry.current !== 'number' ||
    typeof entry.total !== 'number' ||
    !Number.isInteger(entry.current) ||
    !Number.isInteger(entry.total) ||
    entry.current < 1 ||
    entry.total < 2 ||
    entry.current > entry.total
  ) {
    return undefined;
  }

  return {
    current: entry.current,
    total: entry.total,
    groupId: entry.groupId,
  };
}

function hasSameInstallment(
  left: TransactionInstallment | undefined,
  right: unknown
): right is TransactionInstallment | undefined {
  if (!left && !right) return true;
  if (!left || !right || typeof right !== 'object') return false;

  const entry = right as Partial<TransactionInstallment>;
  return (
    left.current === entry.current &&
    left.total === entry.total &&
    left.groupId === entry.groupId
  );
}

function sanitizeStoredTransaction(
  raw: unknown,
  index: number
): { value: Transaction; changed: boolean } | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Partial<Transaction>;

  if (entry.kind !== 'income' && entry.kind !== 'expense') return null;
  if (typeof entry.amount !== 'number' || !Number.isFinite(entry.amount) || entry.amount <= 0) return null;
  if (!isIsoDate(entry.date)) return null;
  if (typeof entry.categoryId !== 'string' || !entry.categoryId) return null;
  if (typeof entry.description !== 'string' || entry.description.trim().length === 0) return null;

  const fallbackId = `txn_legacy_${entry.date}_${index}`;
  const source = entry.source === 'recurring' ? 'recurring' : 'manual';
  const nowIso = new Date().toISOString();
  const cycleId = isMonthKey(entry.cycleId)
    ? entry.cycleId
    : (entry.date.slice(0, 7) as `${number}-${number}`);
  const installment = sanitizeInstallment(entry.installment);

  const value: Transaction = {
    id: typeof entry.id === 'string' && entry.id ? entry.id : fallbackId,
    cardId: DEFAULT_CARD_CONFIG.id,
    kind: entry.kind,
    amount: entry.amount,
    date: entry.date,
    cycleId,
    categoryId: entry.categoryId,
    description: entry.description.trim(),
    notes: typeof entry.notes === 'string' && entry.notes.trim() ? entry.notes.trim() : undefined,
    installment,
    source,
    recurringEntryId: typeof entry.recurringEntryId === 'string' ? entry.recurringEntryId : undefined,
    createdAt: isIsoTimestamp(entry.createdAt) ? entry.createdAt : nowIso,
    updatedAt: isIsoTimestamp(entry.updatedAt) ? entry.updatedAt : nowIso,
  };

  const changed =
    value.id !== entry.id ||
    entry.cardId !== DEFAULT_CARD_CONFIG.id ||
    entry.source !== source ||
    !isMonthKey(entry.cycleId) ||
    !hasSameInstallment(installment, entry.installment) ||
    !isIsoTimestamp(entry.createdAt) ||
    !isIsoTimestamp(entry.updatedAt);

  return { value, changed };
}

function sanitizeStoredRecurring(
  raw: unknown,
  index: number
): { value: RecurringEntry; changed: boolean } | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Partial<RecurringEntry>;

  if (entry.kind !== 'income' && entry.kind !== 'expense') return null;
  if (typeof entry.amount !== 'number' || !Number.isFinite(entry.amount) || entry.amount <= 0) return null;
  if (typeof entry.dayOfMonth !== 'number' || !Number.isInteger(entry.dayOfMonth) || entry.dayOfMonth < 1 || entry.dayOfMonth > 31) return null;
  if (typeof entry.categoryId !== 'string' || !entry.categoryId) return null;
  if (typeof entry.description !== 'string' || entry.description.trim().length === 0) return null;
  if (!isMonthKey(entry.startMonth)) return null;
  if (entry.endMonth && !isMonthKey(entry.endMonth)) return null;

  const fallbackId = `rec_legacy_${entry.startMonth}_${index}`;
  const nowIso = new Date().toISOString();

  const value: RecurringEntry = {
    id: typeof entry.id === 'string' && entry.id ? entry.id : fallbackId,
    cardId: DEFAULT_CARD_CONFIG.id,
    kind: entry.kind,
    frequency: 'monthly',
    amount: entry.amount,
    dayOfMonth: entry.dayOfMonth,
    categoryId: entry.categoryId,
    description: entry.description.trim(),
    notes: typeof entry.notes === 'string' && entry.notes.trim() ? entry.notes.trim() : undefined,
    startMonth: entry.startMonth,
    endMonth: entry.endMonth,
    active: typeof entry.active === 'boolean' ? entry.active : true,
    createdAt: isIsoTimestamp(entry.createdAt) ? entry.createdAt : nowIso,
    updatedAt: isIsoTimestamp(entry.updatedAt) ? entry.updatedAt : nowIso,
  };

  const changed =
    value.id !== entry.id ||
    entry.cardId !== DEFAULT_CARD_CONFIG.id ||
    entry.frequency !== 'monthly' ||
    typeof entry.active !== 'boolean' ||
    !isIsoTimestamp(entry.createdAt) ||
    !isIsoTimestamp(entry.updatedAt);

  return { value, changed };
}

function sanitizeStoredBudgetConfig(
  raw: unknown
): { value: BudgetConfig | null; changed: boolean } {
  if (!raw || typeof raw !== 'object') {
    return { value: null, changed: Boolean(raw) };
  }

  const entry = raw as Partial<BudgetConfig>;
  if (
    entry.id !== 'budget-main' ||
    !isMonthKey(entry.month) ||
    typeof entry.targetAmount !== 'number' ||
    !Number.isFinite(entry.targetAmount) ||
    entry.targetAmount <= 0
  ) {
    return { value: null, changed: true };
  }

  const nowIso = new Date().toISOString();
  const value: BudgetConfig = {
    id: 'budget-main',
    month: entry.month,
    targetAmount: entry.targetAmount,
    updatedAt: isIsoTimestamp(entry.updatedAt) ? entry.updatedAt : nowIso,
  };

  return {
    value,
    changed:
      !isIsoTimestamp(entry.updatedAt),
  };
}

function sanitizeStoredCardConfig(
  raw: unknown
): { value: CardConfig; changed: boolean } {
  if (!raw || typeof raw !== 'object') {
    return { value: DEFAULT_CARD_CONFIG, changed: Boolean(raw) };
  }

  const entry = raw as Partial<CardConfig>;
  const closingDay = entry.closingDay;
  const dueDay = entry.dueDay;
  const name = typeof entry.name === 'string' ? entry.name.trim() : '';

  if (
    entry.id !== DEFAULT_CARD_CONFIG.id ||
    !name ||
    typeof closingDay !== 'number' ||
    !Number.isInteger(closingDay) ||
    closingDay < 1 ||
    closingDay > 31 ||
    typeof dueDay !== 'number' ||
    !Number.isInteger(dueDay) ||
    dueDay < 1 ||
    dueDay > 31 ||
    entry.currency !== DEFAULT_CARD_CONFIG.currency
  ) {
    return { value: DEFAULT_CARD_CONFIG, changed: true };
  }

  const value: CardConfig = {
    id: DEFAULT_CARD_CONFIG.id,
    name,
    closingDay,
    dueDay,
    currency: DEFAULT_CARD_CONFIG.currency,
  };

  return {
    value,
    changed:
      entry.name !== name,
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const rawData = await readJson<unknown>(TRANSACTIONS_KEY, []);
  const data = Array.isArray(rawData) ? rawData : [];
  const sanitized = data
    .map((entry, index) => sanitizeStoredTransaction(entry, index))
    .filter((entry): entry is { value: Transaction; changed: boolean } => Boolean(entry));

  if (sanitized.length !== data.length || sanitized.some((entry) => entry.changed)) {
    devWarn('[transactions] invalid payload detected and sanitized', {
      total: data.length,
      valid: sanitized.length,
    });
    await writeJson(
      TRANSACTIONS_KEY,
      sanitized.map((entry) => entry.value)
    );
  }

  return sanitized.map((entry) => entry.value).sort((a, b) => b.date.localeCompare(a.date));
}

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
  const current = await listTransactions();
  const card = await getCardConfig();
  const created = createTransaction(input, card, { id: generateId('txn') });
  await writeJson(TRANSACTIONS_KEY, [created, ...current]);
  return created;
}

export async function addInstallmentTransaction(
  input: NewTransactionInput,
  installmentTotal: number,
  installmentCurrent: number = 1
): Promise<Transaction[]> {
  const current = await listTransactions();
  const card = await getCardConfig();
  const now = new Date();
  const created = createInstallmentTransactions(input, installmentTotal, card, {
    idPrefix: generateId('txn'),
    groupId: generateId('installment'),
    installmentCurrent,
    now,
  });
  await writeJson(TRANSACTIONS_KEY, [...created, ...current]);
  return created;
}

export async function updateTransaction(
  transactionId: string,
  changes: EditTransactionInput
): Promise<Transaction | null> {
  const current = await listTransactions();
  const target = current.find((entry) => entry.id === transactionId);
  if (!target) {
    return null;
  }

  const card = await getCardConfig();
  const updated = editTransaction(target, changes, card);
  const next = current.map((entry) => (entry.id === transactionId ? updated : entry));
  await writeJson(TRANSACTIONS_KEY, next);
  return updated;
}

export async function removeTransactionById(transactionId: string): Promise<void> {
  const current = await listTransactions();
  await writeJson(
    TRANSACTIONS_KEY,
    current.filter((entry) => entry.id !== transactionId)
  );
}

export async function removeTransactionsByInstallmentGroup(groupId: string): Promise<void> {
  const current = await listTransactions();
  await writeJson(
    TRANSACTIONS_KEY,
    current.filter((entry) => entry.installment?.groupId !== groupId)
  );
}

export async function removeTransactionsByInstallmentGroupFromCurrent(
  groupId: string,
  currentInstallment: number
): Promise<void> {
  const current = await listTransactions();
  await writeJson(
    TRANSACTIONS_KEY,
    current.filter(
      (entry) =>
        entry.installment?.groupId !== groupId ||
        (entry.installment.current ?? 0) < currentInstallment
    )
  );
}

export async function listRecurringEntries(): Promise<RecurringEntry[]> {
  const rawData = await readJson<unknown>(RECURRING_KEY, []);
  const data = Array.isArray(rawData) ? rawData : [];
  const sanitized = data
    .map((entry, index) => sanitizeStoredRecurring(entry, index))
    .filter((entry): entry is { value: RecurringEntry; changed: boolean } => Boolean(entry));

  if (sanitized.length !== data.length || sanitized.some((entry) => entry.changed)) {
    devWarn('[recurring] invalid payload detected and sanitized', {
      total: data.length,
      valid: sanitized.length,
    });
    await writeJson(
      RECURRING_KEY,
      sanitized.map((entry) => entry.value)
    );
  }

  return sanitized
    .map((entry) => entry.value)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function addRecurringEntry(input: NewRecurringEntryInput): Promise<RecurringEntry> {
  const current = await listRecurringEntries();
  const card = await getCardConfig();
  const created = createRecurringEntry(input, card, { id: generateId('rec') });
  await writeJson(RECURRING_KEY, [created, ...current]);
  return created;
}

export async function updateRecurringEntry(
  entryId: string,
  changes: EditRecurringEntryInput
): Promise<RecurringEntry | null> {
  const current = await listRecurringEntries();
  const target = current.find((entry) => entry.id === entryId);
  if (!target) {
    return null;
  }

  const card = await getCardConfig();
  const updated = editRecurringEntry(target, changes, card);
  const next = current.map((entry) => (entry.id === entryId ? updated : entry));
  await writeJson(RECURRING_KEY, next);
  return updated;
}

export async function setRecurringEntryActive(
  entryId: string,
  active: boolean
): Promise<RecurringEntry | null> {
  return updateRecurringEntry(entryId, { active });
}

export async function removeRecurringEntryById(entryId: string): Promise<void> {
  const current = await listRecurringEntries();
  await writeJson(
    RECURRING_KEY,
    current.filter((entry) => entry.id !== entryId)
  );
}

export async function getBudgetConfig(): Promise<BudgetConfig | null> {
  const raw = await readJson<unknown>(BUDGET_KEY, null);
  const sanitized = sanitizeStoredBudgetConfig(raw);

  if (sanitized.changed) {
    if (sanitized.value) {
      await writeJson(BUDGET_KEY, sanitized.value);
    } else {
      await AsyncStorage.removeItem(BUDGET_KEY);
    }
  }

  return sanitized.value;
}

export async function saveBudgetConfig(config: BudgetConfig): Promise<void> {
  await writeJson(BUDGET_KEY, config);
}

export async function upsertBudgetTarget(month: MonthKey, targetAmount: number): Promise<BudgetConfig> {
  const current = await getBudgetConfig();

  const next = current && current.month === month
    ? editBudgetConfig(current, { targetAmount, month })
    : createBudgetConfig(month, targetAmount);

  await saveBudgetConfig(next);
  return next;
}

export async function clearBudgetConfig(): Promise<void> {
  await AsyncStorage.removeItem(BUDGET_KEY);
}

export async function getCardConfig(): Promise<CardConfig> {
  const raw = await readJson<unknown>(CARD_CONFIG_KEY, DEFAULT_CARD_CONFIG);
  const sanitized = sanitizeStoredCardConfig(raw);

  if (sanitized.changed) {
    await writeJson(CARD_CONFIG_KEY, sanitized.value);
  }

  return sanitized.value;
}

export async function saveCardConfig(config: CardConfig): Promise<void> {
  await writeJson(CARD_CONFIG_KEY, config);
}

export async function updateCardConfig(
  changes: Partial<Pick<CardConfig, 'name' | 'closingDay' | 'dueDay'>>
): Promise<CardConfig> {
  const current = await getCardConfig();
  const next = editCardConfig(current, changes);
  await saveCardConfig(next);
  return next;
}

export async function resetCardConfig(): Promise<void> {
  await writeJson(CARD_CONFIG_KEY, DEFAULT_CARD_CONFIG);
}

function normalizeCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function categoryIdFromName(kind: Category['kind'], name: string, usage: NonNullable<Category['usage']>) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `custom-${kind}-${usage}-${slug || Date.now().toString(36)}`;
}

function sanitizeStoredCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<Category>;
  if (typeof candidate.id !== 'string' || !candidate.id) return null;
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) return null;
  if (candidate.kind !== 'income' && candidate.kind !== 'expense') return null;
  if (typeof candidate.active !== 'boolean') return null;

  const usage =
    candidate.kind === 'income'
      ? 'all'
      : candidate.usage === 'fixed' || candidate.usage === 'variable' || candidate.usage === 'all'
        ? candidate.usage
        : 'all';

  return {
    id: candidate.id,
    name: normalizeCategoryName(candidate.name),
    kind: candidate.kind,
    usage,
    system: false,
    active: candidate.active,
  };
}

async function listStoredCategories(): Promise<Category[]> {
  const rawStored = await readJson<unknown>(CUSTOM_CATEGORIES_KEY, []);
  const stored = Array.isArray(rawStored) ? rawStored : [];
  const sanitized = stored.map(sanitizeStoredCategory).filter((entry): entry is Category => Boolean(entry));

  // Keep storage healthy if we had invalid historical payloads.
  if (sanitized.length !== stored.length) {
    devWarn('[categories] invalid custom categories detected and sanitized', {
      total: stored.length,
      valid: sanitized.length,
    });
    await writeJson(CUSTOM_CATEGORIES_KEY, sanitized);
  }

  return sanitized;
}

async function listInactiveSystemCategoryIds(): Promise<string[]> {
  const raw = await readJson<unknown>(INACTIVE_SYSTEM_CATEGORIES_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

type ListCategoriesOptions = {
  includeInactive?: boolean;
};

export async function listCategories(options?: ListCategoriesOptions): Promise<Category[]> {
  const custom = await listStoredCategories();
  const inactiveSystemIds = new Set(await listInactiveSystemCategoryIds());
  const map = new Map<string, Category>();

  for (const entry of DEFAULT_CATEGORIES) {
    map.set(entry.id, { ...entry, active: !inactiveSystemIds.has(entry.id) });
  }

  for (const entry of custom) {
    map.set(entry.id, entry);
  }

  return [...map.values()]
    .filter((entry) => (options?.includeInactive ? true : entry.active))
    .sort((a, b) => {
      if (a.system === b.system) {
        return a.name.localeCompare(b.name);
      }
      return a.system ? -1 : 1;
    });
}

export async function createCustomCategory(input: {
  name: string;
  kind: Category['kind'];
  usage?: Category['usage'];
}): Promise<Category> {
  const normalizedName = normalizeCategoryName(input.name);
  if (!normalizedName) {
    throw new Error('Nome da categoria é obrigatório.');
  }

  const usage: NonNullable<Category['usage']> = input.kind === 'income' ? 'all' : input.usage ?? 'all';
  const allCategories = await listCategories({ includeInactive: true });
  const existing = allCategories.find(
    (entry) =>
      entry.kind === input.kind &&
      (entry.usage ?? 'all') === usage &&
      entry.name.toLowerCase() === normalizedName.toLowerCase()
  );

  if (existing) {
    if (!existing.active) {
      const reactivated = await setCategoryActive(existing.id, true);
      if (reactivated) {
        return reactivated;
      }
    }
    return existing;
  }

  const custom = await listStoredCategories();
  const next: Category = {
    id: categoryIdFromName(input.kind, normalizedName, usage),
    name: normalizedName,
    kind: input.kind,
    usage,
    system: false,
    active: true,
  };

  await writeJson(CUSTOM_CATEGORIES_KEY, [next, ...custom]);
  return next;
}

export async function listCustomCategories(filters?: {
  kind?: Category['kind'];
  usage?: Category['usage'];
}): Promise<Category[]> {
  const custom = await listStoredCategories();

  return custom.filter((entry) => {
    if (!entry.active) return false;
    if (filters?.kind && entry.kind !== filters.kind) return false;
    if (filters?.usage && (entry.usage ?? 'all') !== filters.usage) return false;
    return true;
  });
}

export async function removeCustomCategory(categoryId: string): Promise<void> {
  const defaultCategory = DEFAULT_CATEGORIES.find((entry) => entry.id === categoryId);
  if (defaultCategory) {
    throw new Error('Categorias padrão não podem ser removidas.');
  }

  const custom = await listStoredCategories();
  const target = custom.find((entry) => entry.id === categoryId);
  if (!target) {
    throw new Error('Categoria customizada não encontrada.');
  }

  const [transactions, recurringEntries] = await Promise.all([
    listTransactions(),
    listRecurringEntries(),
  ]);

  const inTransactions = transactions.some((entry) => entry.categoryId === categoryId);
  if (inTransactions) {
    throw new Error('Categoria em uso por lançamentos. Remova os vínculos antes de excluir.');
  }

  const inRecurring = recurringEntries.some((entry) => entry.categoryId === categoryId);
  if (inRecurring) {
    throw new Error('Categoria em uso por recorrências. Remova os vínculos antes de excluir.');
  }

  await writeJson(
    CUSTOM_CATEGORIES_KEY,
    custom.filter((entry) => entry.id !== categoryId)
  );
}

export async function setCategoryActive(categoryId: string, active: boolean): Promise<Category | null> {
  const defaultCategory = DEFAULT_CATEGORIES.find((entry) => entry.id === categoryId);
  if (defaultCategory) {
    const inactiveSystemIds = new Set(await listInactiveSystemCategoryIds());
    if (active) {
      inactiveSystemIds.delete(categoryId);
    } else {
      inactiveSystemIds.add(categoryId);
    }

    await writeJson(INACTIVE_SYSTEM_CATEGORIES_KEY, [...inactiveSystemIds]);
    return { ...defaultCategory, active };
  }

  const custom = await listStoredCategories();
  const target = custom.find((entry) => entry.id === categoryId);
  if (!target) {
    return null;
  }

  const next = custom.map((entry) => (entry.id === categoryId ? { ...entry, active } : entry));
  await writeJson(CUSTOM_CATEGORIES_KEY, next);
  return { ...target, active };
}
