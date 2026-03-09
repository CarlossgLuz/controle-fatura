import type { IsoDateString } from '@/domain/types';

export type MonthKey = `${number}-${number}`;

export type CardId = 'card-main';
export const SINGLE_CARD_ID: CardId = 'card-main';

export type TransactionKind = 'income' | 'expense';
export type TransactionSource = 'manual' | 'recurring';

export interface Category {
  id: string;
  name: string;
  kind: TransactionKind;
  usage?: 'all' | 'fixed' | 'variable';
  system: boolean;
  active: boolean;
}

export interface CardConfig {
  id: CardId;
  name: string;
  closingDay: number;
  dueDay: number;
  currency: 'BRL';
}

export interface InvoiceCycle {
  id: MonthKey;
  start: IsoDateString;
  end: IsoDateString;
  closing: IsoDateString;
  due: IsoDateString;
}

export interface Transaction {
  id: string;
  cardId: CardId;
  kind: TransactionKind;
  amount: number;
  date: IsoDateString;
  cycleId: InvoiceCycle['id'];
  categoryId: Category['id'];
  description: string;
  notes?: string;
  source: TransactionSource;
  recurringEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewTransactionInput = Omit<
  Transaction,
  'id' | 'cycleId' | 'createdAt' | 'updatedAt' | 'source'
> & {
  source?: TransactionSource;
};

export type EditTransactionInput = Partial<
  Pick<Transaction, 'amount' | 'date' | 'categoryId' | 'description' | 'notes' | 'kind'>
>;

export type RecurringFrequency = 'monthly';

export interface RecurringEntry {
  id: string;
  cardId: CardId;
  kind: TransactionKind;
  frequency: RecurringFrequency;
  amount: number;
  dayOfMonth: number;
  categoryId: Category['id'];
  description: string;
  notes?: string;
  startMonth: MonthKey;
  endMonth?: MonthKey;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewRecurringEntryInput = Omit<
  RecurringEntry,
  'id' | 'frequency' | 'createdAt' | 'updatedAt' | 'active'
> & {
  active?: boolean;
};

export type EditRecurringEntryInput = Partial<
  Pick<
    RecurringEntry,
    'amount' | 'dayOfMonth' | 'categoryId' | 'description' | 'notes' | 'endMonth' | 'active' | 'kind'
  >
>;

export interface BudgetConfig {
  id: 'budget-main';
  month: MonthKey;
  targetAmount: number;
  updatedAt: string;
}

export const DEFAULT_CARD_CONFIG: CardConfig = {
  id: SINGLE_CARD_ID,
  name: 'Cartão principal',
  closingDay: 5,
  dueDay: 8,
  currency: 'BRL',
};
