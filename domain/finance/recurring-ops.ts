import { calculateInvoiceCycleByDate } from '@/domain/finance/invoice-cycle';
import {
  assertNonEmptyText,
  assertSingleCard,
  isValidAmount,
  isValidDayOfMonth,
  isValidMonthKey,
} from '@/domain/finance/rules';
import type {
  CardConfig,
  EditRecurringEntryInput,
  MonthKey,
  NewRecurringEntryInput,
  RecurringEntry,
  Transaction,
} from '@/domain/finance/types';

interface CreateRecurringEntryOptions {
  id: string;
  now?: Date;
}

interface MaterializeOptions {
  transactionId: string;
  now?: Date;
}

function toIsoDate(year: number, month: number, day: number): `${number}-${number}-${number}` {
  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as `${number}-${number}-${number}`;
}

function getDayInMonth(year: number, month: number, day: number): number {
  const max = new Date(year, month, 0).getDate();
  return Math.min(day, max);
}

export function createRecurringEntry(
  input: NewRecurringEntryInput,
  card: CardConfig,
  options: CreateRecurringEntryOptions
): RecurringEntry {
  assertSingleCard(input.cardId, card);
  assertNonEmptyText(input.description, 'Descrição');

  if (!isValidAmount(input.amount)) {
    throw new Error('Valor recorrente inválido.');
  }

  if (!isValidDayOfMonth(input.dayOfMonth)) {
    throw new Error('Dia da recorrência inválido.');
  }

  if (!isValidMonthKey(input.startMonth)) {
    throw new Error('Mês inicial inválido.');
  }

  if (input.endMonth && !isValidMonthKey(input.endMonth)) {
    throw new Error('Mês final inválido.');
  }

  const now = options.now ?? new Date();

  return {
    ...input,
    id: options.id,
    frequency: 'monthly',
    active: input.active ?? true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function editRecurringEntry(
  current: RecurringEntry,
  changes: EditRecurringEntryInput,
  card: CardConfig,
  now: Date = new Date()
): RecurringEntry {
  assertSingleCard(current.cardId, card);

  const nextAmount = changes.amount ?? current.amount;
  const nextDay = changes.dayOfMonth ?? current.dayOfMonth;
  const nextDescription = changes.description ?? current.description;

  if (!isValidAmount(nextAmount)) {
    throw new Error('Valor recorrente inválido.');
  }

  if (!isValidDayOfMonth(nextDay)) {
    throw new Error('Dia da recorrência inválido.');
  }

  assertNonEmptyText(nextDescription, 'Descrição');

  if (changes.endMonth && !isValidMonthKey(changes.endMonth)) {
    throw new Error('Mês final inválido.');
  }

  return {
    ...current,
    ...changes,
    updatedAt: now.toISOString(),
  };
}

export function removeRecurringEntry(entries: RecurringEntry[], entryId: string): RecurringEntry[] {
  return entries.filter((entry) => entry.id !== entryId);
}

export function materializeRecurringEntryForMonth(
  entry: RecurringEntry,
  month: MonthKey,
  card: CardConfig,
  options: MaterializeOptions
): Transaction | null {
  if (!entry.active) {
    return null;
  }

  if (!isValidMonthKey(month)) {
    throw new Error('Mês de referência inválido.');
  }

  if (month < entry.startMonth) {
    return null;
  }

  if (entry.endMonth && month > entry.endMonth) {
    return null;
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const day = getDayInMonth(year, monthNumber, entry.dayOfMonth);
  const date = toIsoDate(year, monthNumber, day);
  const cycle = calculateInvoiceCycleByDate(date, card);
  const now = options.now ?? new Date();

  return {
    id: options.transactionId,
    cardId: entry.cardId,
    kind: entry.kind,
    amount: entry.amount,
    date,
    cycleId: cycle.id,
    categoryId: entry.categoryId,
    description: entry.description,
    notes: entry.notes,
    source: 'recurring',
    recurringEntryId: entry.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
