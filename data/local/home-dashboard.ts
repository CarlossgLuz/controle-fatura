import { listCompras, listarComprasDoCicloAtual } from '@/data/sqlite';
import { CARTAO_PADRAO, resumirComprasDoCiclo, type Compra } from '@/domain';
import { buildFinanceDashboardSnapshot, type DashboardMovement } from '@/domain/finance';

import { getBudgetConfig, listRecurringEntries, listTransactions } from '@/data/local/finance-repository';

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function mapPurchaseToMovement(compra: Compra): DashboardMovement {
  return {
    id: compra.id,
    title: compra.titulo,
    amount: compra.valor,
    date: compra.dataCompra,
    kind: 'expense',
    source: 'card',
  };
}

export async function getHomeDashboardSnapshot(referenceDate: Date = new Date()) {
  const monthKey = toMonthKey(referenceDate);

  const [transactions, recurringEntries, budget, cicloCompras, todasCompras] = await Promise.all([
    listTransactions(),
    listRecurringEntries(),
    getBudgetConfig(),
    listarComprasDoCicloAtual(referenceDate, CARTAO_PADRAO),
    listCompras(),
  ]);

  const totalFaturaAtual = resumirComprasDoCiclo(cicloCompras).totalFaturaAtual;

  const comprasDoMes = todasCompras.filter((compra) => compra.dataCompra.startsWith(monthKey));
  const totalComprasDoMes = comprasDoMes.reduce((sum, compra) => sum + compra.valor, 0);

  const cardMovements = todasCompras.slice(0, 8).map(mapPurchaseToMovement);

  return buildFinanceDashboardSnapshot({
    referenceDate,
    transactions,
    recurringEntries,
    budget,
    cardInvoiceTotal: totalFaturaAtual,
    cardMonthExpense: totalComprasDoMes,
    cardMovements,
  });
}
