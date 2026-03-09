import { listCompras, listarComprasDoCicloAtual } from '@/data/sqlite';
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
  const [transactionsResult, recurringResult, budgetResult, categoriesResult, cyclePurchasesResult, purchasesResult] =
    await Promise.allSettled([
      listTransactions(),
      listRecurringEntries(),
      getBudgetConfig(),
      listCategories(),
      listarComprasDoCicloAtual(referenceDate, CARTAO_PADRAO),
      listCompras(),
    ]);

  if (transactionsResult.status === 'rejected') throw sourceError('transactions', transactionsResult.reason);
  if (recurringResult.status === 'rejected') throw sourceError('recurring', recurringResult.reason);
  if (budgetResult.status === 'rejected') throw sourceError('budget', budgetResult.reason);
  if (categoriesResult.status === 'rejected') throw sourceError('categories', categoriesResult.reason);
  if (cyclePurchasesResult.status === 'rejected') throw sourceError('cycle-purchases', cyclePurchasesResult.reason);
  if (purchasesResult.status === 'rejected') throw sourceError('purchases', purchasesResult.reason);

  const summary = aggregateMonthFinanceData({
    referenceDate,
    transactions: transactionsResult.value,
    recurringEntries: recurringResult.value,
    budget: budgetResult.value,
    purchases: purchasesResult.value,
    categories: categoriesResult.value,
  });

  const currentCardInvoice = resumirComprasDoCiclo(cyclePurchasesResult.value).totalFaturaAtual;

  return {
    summary,
    currentCardInvoice,
  };
}
