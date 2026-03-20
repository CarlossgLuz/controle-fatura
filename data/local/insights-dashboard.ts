import { listCategories, listRecurringEntries, listTransactions, getBudgetConfig } from '@/data/local/finance-repository';
import { loadMonthlyDashboardSource } from '@/data/local/monthly-dashboard-source';
import { aggregateMonthFinanceData } from '@/data/local/finance-month-aggregation';
import { listarCompras } from '@/data/sqlite';

function monthReferenceDate(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1, 12, 0, 0, 0);
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

function getDaysInMonth(referenceDate: Date): number {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
}

export async function getInsightsSnapshot(referenceDate: Date = new Date()) {
  const { summary, currentCardInvoice } = await loadMonthlyDashboardSource(referenceDate);
  const [transactions, recurringEntries, budget, purchases, categories] = await Promise.all([
    listTransactions(),
    listRecurringEntries(),
    getBudgetConfig(),
    listarCompras(),
    listCategories({ includeInactive: true }),
  ]);
  const topExpenseCategory = summary.expensesByCategory[0];
  const daysInMonth = getDaysInMonth(referenceDate);
  const elapsedDays = Math.max(1, Math.min(referenceDate.getDate(), daysInMonth));
  const averageDailyExpense = summary.expenseTotal > 0 ? summary.expenseTotal / elapsedDays : 0;
  const projectedExpense = averageDailyExpense * daysInMonth;
  const historyYear = referenceDate.getFullYear();
  const monthHistory = Array.from({ length: referenceDate.getMonth() + 1 }, (_, monthIndex) => {
    const monthSummary = aggregateMonthFinanceData({
      referenceDate: monthReferenceDate(historyYear, monthIndex),
      transactions,
      recurringEntries,
      budget,
      purchases,
      categories,
    });

    return {
      monthKey: monthSummary.monthKey,
      income: monthSummary.incomeTotal,
      expense: monthSummary.expenseTotal,
      balance: monthSummary.balance,
    };
  });

  return {
    monthKey: summary.monthKey,
    expensesByCategory: toShare(summary.expensesByCategory),
    incomeVsExpense: {
      income: summary.incomeTotal,
      expense: summary.expenseTotal,
    },
    fixedVsVariable: summary.fixedVsVariable,
    budgetProgress: {
      target: summary.budgetTarget,
      spent: summary.expenseTotal,
      progress: summary.budgetProgress,
    },
    paymentMethodUsage: toShare(summary.paymentUsage),
    quickPulse: {
      balance: summary.balance,
      cardShare: summary.expenseTotal > 0 ? currentCardInvoice / summary.expenseTotal : 0,
      fixedIncomeShare: summary.incomeTotal > 0 ? summary.fixedExpenseTotal / summary.incomeTotal : null,
      averageDailyExpense,
      projectedExpense,
    },
    topExpenseCategory: topExpenseCategory
      ? {
          ...topExpenseCategory,
          share: summary.expenseTotal > 0 ? topExpenseCategory.amount / summary.expenseTotal : 0,
        }
      : null,
    monthHistory,
    hasAnyData:
      summary.incomeTotal > 0 ||
      summary.expenseTotal > 0 ||
      summary.expensesByCategory.length > 0 ||
      summary.paymentUsage.length > 0 ||
      monthHistory.some((entry) => entry.income > 0 || entry.expense > 0 || entry.balance !== 0),
  };
}
