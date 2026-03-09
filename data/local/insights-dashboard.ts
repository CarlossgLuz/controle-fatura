import { loadMonthlyDashboardSource } from '@/data/local/monthly-dashboard-source';

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

export async function getInsightsSnapshot(referenceDate: Date = new Date()) {
  const { summary } = await loadMonthlyDashboardSource(referenceDate);

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
    hasAnyData:
      summary.incomeTotal > 0 ||
      summary.expenseTotal > 0 ||
      summary.expensesByCategory.length > 0 ||
      summary.paymentUsage.length > 0,
  };
}
