import AsyncStorage from 'expo-sqlite/kv-store';

import type {
  BudgetConfig,
  EditRecurringEntryInput,
  EditTransactionInput,
  NewRecurringEntryInput,
  NewTransactionInput,
  RecurringEntry,
  Transaction,
} from '@/domain/finance/types';
import { createRecurringEntry, createTransaction, editRecurringEntry, editTransaction } from '@/domain/finance';
import { DEFAULT_CARD_CONFIG } from '@/domain/finance/types';

const TRANSACTIONS_KEY = 'finance.transactions.v1';
const RECURRING_KEY = 'finance.recurring.v1';
const BUDGET_KEY = 'finance.budget.v1';

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
  const created = createTransaction(input, DEFAULT_CARD_CONFIG, { id: generateId('txn') });
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

  const updated = editTransaction(target, changes, DEFAULT_CARD_CONFIG);
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
  const created = createRecurringEntry(input, DEFAULT_CARD_CONFIG, { id: generateId('rec') });
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

  const updated = editRecurringEntry(target, changes, DEFAULT_CARD_CONFIG);
  const next = current.map((entry) => (entry.id === entryId ? updated : entry));
  await writeJson(RECURRING_KEY, next);
  return updated;
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
