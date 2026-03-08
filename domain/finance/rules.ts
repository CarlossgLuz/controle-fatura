import type { MetaMensal, TipoRecorrencia } from '@/domain/finance/types';

export function ehRecorrente(tipo: TipoRecorrencia): boolean {
  return tipo === 'recorrente';
}

export function validarMetaMensal(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0;
}

export function criarMetaMensal(valor: number, mesReferencia: `${number}-${number}`): MetaMensal {
  if (!validarMetaMensal(valor)) {
    throw new Error('Meta mensal inválida.');
  }

  return {
    id: 'meta-mensal',
    valor,
    mesReferencia,
    atualizadaEm: new Date().toISOString(),
  };
}
