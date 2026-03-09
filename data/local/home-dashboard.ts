import { getCardConfig } from '@/data/local/finance-repository';
import { calculateCurrentInvoiceCycle } from '@/domain/finance/invoice-cycle';
import { loadMonthlyDashboardSource } from '@/data/local/monthly-dashboard-source';

function toMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${month}/${year}`;
}

export async function getHomeDashboardSnapshot(referenceDate: Date = new Date()) {
  const [{ summary, currentCardInvoice }, cardConfig] = await Promise.all([
    loadMonthlyDashboardSource(referenceDate),
    getCardConfig(),
  ]);
  const cardCycle = calculateCurrentInvoiceCycle(referenceDate, cardConfig);

  return {
    monthKey: summary.monthKey,
    monthLabel: toMonthLabel(summary.monthKey),
    monthBalance: summary.balance,
    monthIncome: summary.incomeTotal,
    monthExpense: summary.expenseTotal,
    monthFixedExpense: summary.fixedExpenseTotal,
    currentCardInvoice,
    cardCycleClosing: cardCycle.closing,
    cardCycleDue: cardCycle.due,
    budgetTarget: summary.budgetTarget,
    budgetProgress: summary.budgetProgress,
    recentMovements: summary.recentMovements,
    hasMovements: summary.recentMovements.length > 0,
  };
}
