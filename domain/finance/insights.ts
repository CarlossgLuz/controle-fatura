import type { BudgetConfig, RecurringEntry, Transaction } from '@/domain/finance/types';

export interface InsightBreakdownItem {
  id: string;
  label: string;
  amount: number;
  share: number;
}

export interface FinanceInsightsSnapshot {
  monthKey: string;
  expensesByCategory: InsightBreakdownItem[];
  incomeVsExpense: {
    income: number;
    expense: number;
  };
  fixedVsVariable: {
    fixed: number;
    variable: number;
  };
  budgetProgress: {
    target: number;
    spent: number;
    progress: number;
  };
  paymentMethodUsage: InsightBreakdownItem[];
}

interface BuildInsightsInput {
  referenceDate: Date;
  transactions: Transaction[];
  recurringEntries: RecurringEntry[];
  budget: BudgetConfig | null;
  cardMonthExpense: number;
  expensesByCategory: Array<{ id: string; label: string; amount: number }>;
  paymentUsage: Array<{ id: string; label: string; amount: number }>;
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function occursInMonth(startMonth: string, endMonth: string | undefined, month: string): boolean {
  if (month < startMonth) return false;
  if (endMonth && month > endMonth) return false;
  return true;
}

function toShare(items: Array<{ id: string; label: string; amount: number }>): InsightBreakdownItem[] {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) {
    return items.map((item) => ({ ...item, share: 0 }));
  }

  return items.map((item) => ({
    ...item,
    share: item.amount / total,
  }));
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function buildFinanceInsightsSnapshot(input: BuildInsightsInput): FinanceInsightsSnapshot {
  const monthKey = toMonthKey(input.referenceDate);
  const monthTransactions = input.transactions.filter((entry) => entry.date.startsWith(monthKey));

  const income = monthTransactions
    .filter((entry) => entry.kind === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const expenseFromTransactions = monthTransactions
    .filter((entry) => entry.kind === 'expense' && entry.source !== 'recurring')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const fixed = input.recurringEntries
    .filter(
      (entry) =>
        entry.active &&
        entry.kind === 'expense' &&
        occursInMonth(entry.startMonth, entry.endMonth, monthKey)
    )
    .reduce((sum, entry) => sum + entry.amount, 0);

  const expense = expenseFromTransactions + fixed + input.cardMonthExpense;
  const variable = Math.max(expense - fixed, 0);

  const target = input.budget?.month === monthKey ? input.budget.targetAmount : 0;
  const progress = target > 0 ? clampProgress(expense / target) : 0;

  const byCategory = toShare(input.expensesByCategory)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const paymentMethodUsage = toShare(input.paymentUsage)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    monthKey,
    expensesByCategory: byCategory,
    incomeVsExpense: { income, expense },
    fixedVsVariable: { fixed, variable },
    budgetProgress: { target, spent: expense, progress },
    paymentMethodUsage,
  };
}
