import type { BudgetConfig, RecurringEntry, Transaction } from '@/domain/finance/types';

export interface DashboardMovement {
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

export interface FinanceDashboardSnapshot {
  monthKey: string;
  monthBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthFixedExpense: number;
  currentCardInvoice: number;
  budgetTarget: number;
  budgetProgress: number;
  recentMovements: DashboardMovement[];
}

interface BuildDashboardInput {
  referenceDate: Date;
  transactions: Transaction[];
  recurringEntries: RecurringEntry[];
  budget: BudgetConfig | null;
  cardInvoiceTotal: number;
  cardMonthExpense: number;
  cardMovements: DashboardMovement[];
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function occursInMonth(startMonth: string, endMonth: string | undefined, month: string): boolean {
  if (month < startMonth) {
    return false;
  }

  if (endMonth && month > endMonth) {
    return false;
  }

  return true;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

export function buildFinanceDashboardSnapshot(input: BuildDashboardInput): FinanceDashboardSnapshot {
  const monthKey = toMonthKey(input.referenceDate);

  const monthTransactions = input.transactions.filter((entry) => entry.date.startsWith(monthKey));

  const monthIncome = monthTransactions
    .filter((entry) => entry.kind === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const monthExpenseFromTransactions = monthTransactions
    .filter((entry) => entry.kind === 'expense' && entry.source !== 'recurring')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const monthFixedExpense = input.recurringEntries
    .filter(
      (entry) =>
        entry.active &&
        entry.kind === 'expense' &&
        occursInMonth(entry.startMonth, entry.endMonth, monthKey)
    )
    .reduce((sum, entry) => sum + entry.amount, 0);

  const monthExpense = monthExpenseFromTransactions + monthFixedExpense + input.cardMonthExpense;
  const monthBalance = monthIncome - monthExpense;

  const budgetTarget =
    input.budget && input.budget.month === monthKey ? input.budget.targetAmount : 0;
  const budgetProgress = budgetTarget > 0 ? clampProgress(monthExpense / budgetTarget) : 0;

  const transactionMovements: DashboardMovement[] = monthTransactions.map((entry) => ({
    id: entry.id,
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

  const recentMovements = [...input.cardMovements, ...transactionMovements]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return {
    monthKey,
    monthBalance,
    monthIncome,
    monthExpense,
    monthFixedExpense,
    currentCardInvoice: input.cardInvoiceTotal,
    budgetTarget,
    budgetProgress,
    recentMovements,
  };
}
