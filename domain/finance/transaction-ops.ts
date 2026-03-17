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

interface CreateInstallmentTransactionsOptions {
  idPrefix: string;
  groupId: string;
  now?: Date;
}

function toLocalDate(input: `${number}-${number}-${number}`): Date {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): `${number}-${number}-${number}` {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`;
}

function addMonthsClamped(input: `${number}-${number}-${number}`, monthsToAdd: number): `${number}-${number}-${number}` {
  const date = toLocalDate(input);
  const targetMonthIndex = date.getMonth() + monthsToAdd;
  const lastDayOfTargetMonth = new Date(date.getFullYear(), targetMonthIndex + 1, 0).getDate();
  return toIsoDate(new Date(date.getFullYear(), targetMonthIndex, Math.min(date.getDate(), lastDayOfTargetMonth)));
}

function splitAmount(amount: number, parts: number): number[] {
  const totalInCents = Math.round(amount * 100);
  const base = Math.floor(totalInCents / parts);
  const remainder = totalInCents % parts;

  return Array.from({ length: parts }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100);
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
    id: options.id,
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

export function createInstallmentTransactions(
  input: NewTransactionInput,
  installmentTotal: number,
  card: CardConfig,
  options: CreateInstallmentTransactionsOptions & { installmentCurrent?: number }
): Transaction[] {
  if (!Number.isInteger(installmentTotal) || installmentTotal < 2) {
    throw new Error('Quantidade de parcelas inválida.');
  }

  const installmentCurrent = options.installmentCurrent ?? 1;
  if (
    !Number.isInteger(installmentCurrent) ||
    installmentCurrent < 1 ||
    installmentCurrent > installmentTotal
  ) {
    throw new Error('Parcela atual inválida.');
  }

  if (input.kind !== 'expense') {
    throw new Error('Parcelamento disponível apenas para gastos.');
  }

  const amounts = splitAmount(input.amount, installmentTotal).slice(installmentCurrent - 1);

  return amounts.map((amount, index) =>
    createTransaction(
      {
        ...input,
        amount,
        date: addMonthsClamped(input.date, index),
        installment: {
          current: installmentCurrent + index,
          total: installmentTotal,
          groupId: options.groupId,
        },
      },
      card,
      {
        id: `${options.idPrefix}-${index + 1}`,
        now: options.now,
      }
    )
  );
}
