import AsyncStorage from 'expo-sqlite/kv-store';

import {
  DEFAULT_CATEGORIES,
  createBudgetConfig,
  createRecurringEntry,
  createTransaction,
  editBudgetConfig,
  editCardConfig,
  editRecurringEntry,
  editTransaction,
} from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';
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
} from '@/domain/finance/types';

const TRANSACTIONS_KEY = 'finance.transactions.v1';
const RECURRING_KEY = 'finance.recurring.v1';
const BUDGET_KEY = 'finance.budget.v1';
const CARD_CONFIG_KEY = 'finance.card-config.v1';
const CUSTOM_CATEGORIES_KEY = 'finance.categories.v1';

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

export async function listTransactions(): Promise<Transaction[]> {
  const data = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
  return [...data].sort((a, b) => b.date.localeCompare(a.date));
}

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
  const current = await listTransactions();
  const card = await getCardConfig();
  const created = createTransaction(input, card, { id: generateId('txn') });
  await writeJson(TRANSACTIONS_KEY, [created, ...current]);
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

export async function listRecurringEntries(): Promise<RecurringEntry[]> {
  const data = await readJson<RecurringEntry[]>(RECURRING_KEY, []);
  return [...data].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
  return readJson<BudgetConfig | null>(BUDGET_KEY, null);
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
  return readJson<CardConfig>(CARD_CONFIG_KEY, DEFAULT_CARD_CONFIG);
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

async function listStoredCategories(): Promise<Category[]> {
  return readJson<Category[]>(CUSTOM_CATEGORIES_KEY, []);
}

export async function listCategories(): Promise<Category[]> {
  const custom = await listStoredCategories();
  const map = new Map<string, Category>();

  for (const entry of DEFAULT_CATEGORIES) {
    map.set(entry.id, entry);
  }

  for (const entry of custom) {
    map.set(entry.id, entry);
  }

  return [...map.values()]
    .filter((entry) => entry.active)
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
  const allCategories = await listCategories();
  const existing = allCategories.find(
    (entry) =>
      entry.kind === input.kind &&
      (entry.usage ?? 'all') === usage &&
      entry.name.toLowerCase() === normalizedName.toLowerCase()
  );

  if (existing) {
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
