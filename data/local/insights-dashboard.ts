import { listCompras } from '@/data/sqlite';
import { getBudgetConfig, listRecurringEntries, listTransactions } from '@/data/local/finance-repository';
import { buildFinanceInsightsSnapshot } from '@/domain/finance';
import { DEFAULT_CATEGORIES } from '@/domain/finance/categories';
import type { Compra } from '@/domain/types';

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function resolveCategoryLabel(categoryId: string): string {
  return DEFAULT_CATEGORIES.find((entry) => entry.id === categoryId)?.name ?? 'Outros';
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

function sumMapToArray(map: Map<string, number>): Array<{ id: string; label: string; amount: number }> {
  return [...map.entries()].map(([id, amount]) => ({
    id,
    label: resolveCategoryLabel(id),
    amount,
  }));
}

export async function getInsightsSnapshot(referenceDate: Date = new Date()) {
  const monthKey = toMonthKey(referenceDate);

  const [transactions, recurringEntries, budget, purchases] = await Promise.all([
    listTransactions(),
    listRecurringEntries(),
    getBudgetConfig(),
    listCompras(),
  ]);

  const monthTransactions = transactions.filter((entry) => entry.date.startsWith(monthKey));
  const monthPurchases = purchases.filter((entry) => entry.dataCompra.startsWith(monthKey));

  const categorySums = new Map<string, number>();
  for (const entry of monthTransactions) {
    if (entry.kind !== 'expense') continue;
    categorySums.set(entry.categoryId, (categorySums.get(entry.categoryId) ?? 0) + entry.amount);
  }

  for (const purchase of monthPurchases) {
    const categoryId = mapPurchaseCategory(purchase);
    categorySums.set(categoryId, (categorySums.get(categoryId) ?? 0) + purchase.valor);
  }

  const paymentSums = new Map<string, number>();
  for (const entry of monthTransactions) {
    const key = entry.source === 'recurring' ? 'recorrente' : 'manual';
    const label = key === 'recorrente' ? 'Recorrente' : 'Lançamento manual';
    paymentSums.set(label, (paymentSums.get(label) ?? 0) + entry.amount);
  }

  const totalCard = monthPurchases.reduce((sum, purchase) => sum + purchase.valor, 0);
  paymentSums.set('Cartão', (paymentSums.get('Cartão') ?? 0) + totalCard);

  return buildFinanceInsightsSnapshot({
    referenceDate,
    transactions,
    recurringEntries,
    budget,
    cardMonthExpense: totalCard,
    expensesByCategory: sumMapToArray(categorySums),
    paymentUsage: [...paymentSums.entries()].map(([label, amount]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      amount,
    })),
  });
}
