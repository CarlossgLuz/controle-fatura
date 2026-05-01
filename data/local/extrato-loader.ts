import { loadMonthlyDashboardSource } from '@/data/local/monthly-dashboard-source';
import type { MonthlyMovement } from '@/data/local/finance-month-aggregation';

export interface MonthExtract {
  monthKey: string;
  summary: {
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
  };
  movements: MonthlyMovement[];
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year || new Date().getFullYear(), (month || 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;

  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return new Date();
  return new Date(year, month - 1, 1);
}

export async function loadMonthExtract(monthKey: string): Promise<MonthExtract> {
  const { summary } = await loadMonthlyDashboardSource(monthKeyToDate(monthKey));

  return {
    monthKey: summary.monthKey,
    summary: {
      incomeTotal: summary.incomeTotal,
      expenseTotal: summary.expenseTotal,
      balance: summary.balance,
    },
    movements: summary.movements,
  };
}
