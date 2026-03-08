import { calcularCicloPorDataCompra } from '@/domain/invoice-cycle';
import type {
  Compra,
  ConfiguracaoCartao,
  EdicaoCompraInput,
  NovaCompraInput,
} from '@/domain/types';

interface CriarCompraOptions {
  id: string;
  agora?: Date;
}

export function criarCompra(
  input: NovaCompraInput,
  cartao: ConfiguracaoCartao,
  options: CriarCompraOptions
): Compra {
  const agora = options.agora ?? new Date();
  const ciclo = calcularCicloPorDataCompra(input.dataCompra, cartao);

  return {
    ...input,
    id: options.id,
    cicloId: ciclo.id,
    criadoEm: agora.toISOString(),
    atualizadoEm: agora.toISOString(),
  };
}

export function editarCompra(
  compra: Compra,
  edicao: EdicaoCompraInput,
  cartao: ConfiguracaoCartao,
  agora: Date = new Date()
): Compra {
  const proximaDataCompra = edicao.dataCompra ?? compra.dataCompra;
  const ciclo = calcularCicloPorDataCompra(proximaDataCompra, cartao);

  return {
    ...compra,
    ...edicao,
    cicloId: ciclo.id,
    atualizadoEm: agora.toISOString(),
  };
}

export function excluirCompra(compras: Compra[], compraId: string): Compra[] {
  return compras.filter((compra) => compra.id !== compraId);
}
