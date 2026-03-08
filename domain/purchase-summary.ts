import type { Compra } from '@/domain/types';

export interface ResumoComprasCiclo {
  totalFaturaAtual: number;
  quantidadeCompras: number;
  quantidadeParceladas: number;
}

export function resumirComprasDoCiclo(compras: Compra[]): ResumoComprasCiclo {
  return compras.reduce<ResumoComprasCiclo>(
    (acc, compra) => {
      acc.totalFaturaAtual += compra.valor;
      acc.quantidadeCompras += 1;

      if (compra.parcela && compra.parcela.total > 1) {
        acc.quantidadeParceladas += 1;
      }

      return acc;
    },
    {
      totalFaturaAtual: 0,
      quantidadeCompras: 0,
      quantidadeParceladas: 0,
    }
  );
}
