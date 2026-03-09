import { listarCompras, listarComprasDoCicloAtual } from '@/data/sqlite';
import {
  getBudgetConfig,
  listCategories,
  listRecurringEntries,
  listTransactions,
} from '@/data/local/finance-repository';
import { aggregateMonthFinanceData } from '@/data/local/finance-month-aggregation';
import { CARTAO_PADRAO, resumirComprasDoCiclo } from '@/domain';

interface MonthlySourceData {
  summary: ReturnType<typeof aggregateMonthFinanceData>;
  currentCardInvoice: number;
}

function sourceError(source: string, cause: unknown): Error {
  const base = cause instanceof Error ? cause.message : 'erro desconhecido';
  return new Error(`[${source}] ${base}`);
}

export async function loadMonthlyDashboardSource(referenceDate: Date): Promise<MonthlySourceData> {
  const safeReferenceDate = Number.isFinite(referenceDate.getTime()) ? referenceDate : new Date();

  console.info('[dashboard] loadMonthlyDashboardSource:start', {
    referenceDate: safeReferenceDate.toISOString(),
  });

  const [transactionsResult, recurringResult, budgetResult, categoriesResult, cyclePurchasesResult, purchasesResult] =
    await Promise.allSettled([
      listTransactions(),
      listRecurringEntries(),
      getBudgetConfig(),
      listCategories({ includeInactive: true }),
      listarComprasDoCicloAtual(safeReferenceDate, CARTAO_PADRAO),
      listarCompras(),
    ]);

  if (transactionsResult.status === 'rejected') {
    console.warn('[dashboard] source failure:transactions', transactionsResult.reason);
    throw sourceError('transactions', transactionsResult.reason);
  }
  if (recurringResult.status === 'rejected') {
    console.warn('[dashboard] source failure:recurring', recurringResult.reason);
    throw sourceError('recurring', recurringResult.reason);
  }
  if (budgetResult.status === 'rejected') {
    console.warn('[dashboard] source failure:budget', budgetResult.reason);
    throw sourceError('budget', budgetResult.reason);
  }
  if (categoriesResult.status === 'rejected') {
    console.warn('[dashboard] source failure:categories', categoriesResult.reason);
    throw sourceError('categories', categoriesResult.reason);
  }
  if (cyclePurchasesResult.status === 'rejected') {
    console.warn('[dashboard] source failure:cycle-purchases', cyclePurchasesResult.reason);
    throw sourceError('cycle-purchases', cyclePurchasesResult.reason);
  }
  if (purchasesResult.status === 'rejected') {
    console.warn('[dashboard] source failure:purchases', purchasesResult.reason);
    throw sourceError('purchases', purchasesResult.reason);
  }

  const summary = aggregateMonthFinanceData({
    referenceDate: safeReferenceDate,
    transactions: transactionsResult.value,
    recurringEntries: recurringResult.value,
    budget: budgetResult.value,
    purchases: purchasesResult.value,
    categories: categoriesResult.value,
  });

  const currentCardInvoice = resumirComprasDoCiclo(cyclePurchasesResult.value).totalFaturaAtual;

  console.info('[dashboard] loadMonthlyDashboardSource:ok', {
    monthKey: summary.monthKey,
    income: summary.incomeTotal,
    expense: summary.expenseTotal,
    movements: summary.recentMovements.length,
  });

  return {
    summary,
    currentCardInvoice,
  };
}
