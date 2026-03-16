import {
  DEFAULT_CATEGORIES,
  type BudgetConfig,
  type Category,
  type RecurringEntry,
  type Transaction,
} from '@/domain/finance';
import type { Compra } from '@/domain/types';

export interface MonthlyMovement {
  id: string;
  title: string;
  amount: number;
  date: string;
  kind: 'income' | 'expense';
  source: 'manual' | 'recurring' | 'card';
  installment?: {
    current: number;
    total: number;
  };
}

export interface MonthlyAggregation {
  monthKey: string;
  incomeTotal: number;
  expenseTotal: number;
  fixedExpenseTotal: number;
  cardExpenseTotal: number;
  balance: number;
  budgetTarget: number;
  budgetProgress: number;
  recentMovements: MonthlyMovement[];
  expensesByCategory: Array<{ id: string; label: string; amount: number }>;
  paymentUsage: Array<{ id: string; label: string; amount: number }>;
  fixedVsVariable: {
    fixed: number;
    variable: number;
  };
}

function uniqueMovementIds(movements: MonthlyMovement[]): MonthlyMovement[] {
  const seen = new Map<string, number>();

  return movements.map((movement, index) => {
    const base = movement.id && movement.id.trim() ? movement.id : `movement:${movement.date}:${index}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    if (count === 0) {
      return { ...movement, id: base };
    }

    return { ...movement, id: `${base}:${count}` };
  });
}

function toMonthKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function occursInMonth(startMonth: string, endMonth: string | undefined, month: string): boolean {
  if (month < startMonth) return false;
  if (endMonth && month > endMonth) return false;
  return true;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function mapPurchaseCategory(compra: Compra): string {
  const mapping: Record<Compra['categoria'], string> = {
    alimentacao: 'expense-food',
    transporte: 'expense-transport',
    moradia: 'expense-housing',
    saude: 'expense-health',
    educacao: 'expense-education',
    lazer: 'expense-leisure',
    assinaturas: 'expense-subscriptions',
    outros: 'expense-other',
  };

  return mapping[compra.categoria] ?? 'expense-other';
}

function toShare(items: Array<{ id: string; label: string; amount: number }>) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  if (total <= 0) {
    return items.map((item) => ({ ...item, share: 0 }));
  }

  return items.map((item) => ({
    ...item,
    share: item.amount / total,
  }));
}

export function aggregateMonthFinanceData(input: {
  referenceDate: Date;
  transactions: Transaction[];
  recurringEntries: RecurringEntry[];
  budget: BudgetConfig | null;
  purchases: Compra[];
  categories?: Category[];
}): MonthlyAggregation {
  const monthKey = toMonthKey(input.referenceDate);
  const categories = input.categories?.length ? input.categories : DEFAULT_CATEGORIES;
  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  const resolveLabel = (categoryId: string) =>
    categoryById.get(categoryId)?.name ??
    DEFAULT_CATEGORIES.find((entry) => entry.id === categoryId)?.name ??
    'Outros';

  const monthTransactions = input.transactions.filter((entry) => entry.date.startsWith(monthKey));
  const monthPurchases = input.purchases.filter((entry) => entry.dataCompra.startsWith(monthKey));

  const activeRecurringIncome = input.recurringEntries
    .filter(
      (entry) =>
        entry.active &&
        entry.kind === 'income' &&
        occursInMonth(entry.startMonth, entry.endMonth, monthKey)
    )
    .reduce((sum, entry) => sum + entry.amount, 0);

  const activeRecurringExpenseEntries = input.recurringEntries.filter(
    (entry) =>
      entry.active &&
      entry.kind === 'expense' &&
      occursInMonth(entry.startMonth, entry.endMonth, monthKey)
  );

  const recurringFixedExpense = activeRecurringExpenseEntries
    .filter((entry) => (categoryById.get(entry.categoryId)?.usage ?? 'all') !== 'variable')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const recurringVariableExpense = activeRecurringExpenseEntries
    .filter((entry) => (categoryById.get(entry.categoryId)?.usage ?? 'all') === 'variable')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const transactionIncome = monthTransactions
    .filter((entry) => entry.kind === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const transactionExpense = monthTransactions
    .filter((entry) => entry.kind === 'expense' && entry.source !== 'recurring')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const cardExpenseTotal = monthPurchases.reduce((sum, entry) => sum + entry.valor, 0);

  const incomeTotal = safeNumber(transactionIncome + activeRecurringIncome);
  const expenseTotal = safeNumber(
    transactionExpense + recurringFixedExpense + recurringVariableExpense + cardExpenseTotal
  );
  const balance = incomeTotal - expenseTotal;

  const budgetTarget = input.budget?.month === monthKey ? input.budget.targetAmount : 0;
  const budgetProgress = budgetTarget > 0 ? clampProgress(expenseTotal / budgetTarget) : 0;

  const movementTransactions: MonthlyMovement[] = monthTransactions.map((entry, index) => ({
    id: entry.id ? `txn:${entry.id}` : `txn:legacy:${entry.date}:${index}`,
    title: entry.description,
    amount: entry.amount,
    date: entry.date,
    kind: entry.kind,
    source: entry.source,
    installment: entry.installment
      ? {
          current: entry.installment.current,
          total: entry.installment.total,
        }
      : undefined,
  }));

  const movementPurchases: MonthlyMovement[] = monthPurchases.map((entry, index) => ({
    id: entry.id ? `buy:${entry.id}` : `buy:legacy:${entry.dataCompra}:${index}`,
    title: entry.titulo,
    amount: entry.valor,
    date: entry.dataCompra,
    kind: 'expense',
    source: 'card',
    installment: entry.parcela
      ? {
          current: entry.parcela.atual,
          total: entry.parcela.total,
        }
      : undefined,
  }));

  const recentMovements = uniqueMovementIds([...movementTransactions, ...movementPurchases])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const categorySums = new Map<string, number>();
  for (const entry of monthTransactions) {
    if (entry.kind !== 'expense') continue;
    categorySums.set(entry.categoryId, (categorySums.get(entry.categoryId) ?? 0) + entry.amount);
  }

  for (const purchase of monthPurchases) {
    const categoryId = mapPurchaseCategory(purchase);
    categorySums.set(categoryId, (categorySums.get(categoryId) ?? 0) + purchase.valor);
  }

  for (const entry of activeRecurringExpenseEntries) {
    categorySums.set(entry.categoryId, (categorySums.get(entry.categoryId) ?? 0) + entry.amount);
  }

  const paymentSums = new Map<string, number>();

  const manualExpenseTotal = monthTransactions
    .filter((entry) => entry.kind === 'expense' && entry.source !== 'recurring')
    .reduce((sum, entry) => sum + entry.amount, 0);

  if (manualExpenseTotal > 0) {
    paymentSums.set('Lançamento manual', manualExpenseTotal);
  }

  const recurringExpenseTotal = recurringFixedExpense + recurringVariableExpense;
  if (recurringExpenseTotal > 0) {
    paymentSums.set('Recorrente', recurringExpenseTotal);
  }

  if (cardExpenseTotal > 0) {
    paymentSums.set('Cartão', cardExpenseTotal);
  }

  const expensesByCategory = toShare(
    [...categorySums.entries()].map(([id, amount]) => ({
      id,
      label: resolveLabel(id),
      amount,
    }))
  )
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map(({ id, label, amount }) => ({ id, label, amount }));

  const paymentUsage = toShare(
    [...paymentSums.entries()].map(([label, amount]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      amount,
    }))
  )
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(({ id, label, amount }) => ({ id, label, amount }));

  return {
    monthKey,
    incomeTotal,
    expenseTotal,
    fixedExpenseTotal: recurringFixedExpense,
    cardExpenseTotal,
    balance,
    budgetTarget,
    budgetProgress,
    recentMovements,
    expensesByCategory,
    paymentUsage,
    fixedVsVariable: {
      fixed: safeNumber(recurringFixedExpense),
      variable: safeNumber(Math.max(expenseTotal - recurringFixedExpense, 0)),
    },
  };
}
