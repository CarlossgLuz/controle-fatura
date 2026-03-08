import { calculateInvoiceCycleByDate } from '@/domain/finance/invoice-cycle';
import { assertNonEmptyText, assertSingleCard, isValidAmount } from '@/domain/finance/rules';
import type {
  CardConfig,
  EditTransactionInput,
  NewTransactionInput,
  Transaction,
} from '@/domain/finance/types';

interface CreateTransactionOptions {
  id: string;
  now?: Date;
}

export function createTransaction(
  input: NewTransactionInput,
  card: CardConfig,
  options: CreateTransactionOptions
): Transaction {
  assertSingleCard(input.cardId, card);
  assertNonEmptyText(input.description, 'Descrição');
  if (!isValidAmount(input.amount)) {
    throw new Error('Valor da transação inválido.');
  }

  const now = options.now ?? new Date();
  const cycle = calculateInvoiceCycleByDate(input.date, card);

  return {
    ...input,
    cycleId: cycle.id,
    source: input.source ?? 'manual',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function editTransaction(
  current: Transaction,
  changes: EditTransactionInput,
  card: CardConfig,
  now: Date = new Date()
): Transaction {
  const nextAmount = changes.amount ?? current.amount;
  const nextDate = changes.date ?? current.date;
  const nextDescription = changes.description ?? current.description;

  assertSingleCard(current.cardId, card);
  assertNonEmptyText(nextDescription, 'Descrição');
  if (!isValidAmount(nextAmount)) {
    throw new Error('Valor da transação inválido.');
  }

  const cycle = calculateInvoiceCycleByDate(nextDate, card);

  return {
    ...current,
    ...changes,
    cycleId: cycle.id,
    updatedAt: now.toISOString(),
  };
}

export function removeTransaction(transactions: Transaction[], transactionId: string): Transaction[] {
  return transactions.filter((entry) => entry.id !== transactionId);
}
