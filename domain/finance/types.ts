import type { IsoDateString } from '@/domain/types';

export const CARTAO_UNICO_ID = 'cartao-principal' as const;

export type TipoRecorrencia = 'avulso' | 'recorrente';

export interface Receita {
  id: string;
  tipo: TipoRecorrencia;
  titulo: string;
  valor: number;
  dataReferencia: IsoDateString;
  categoria?: string;
  observacao?: string;
}

export interface GastoFixo {
  id: string;
  tipo: TipoRecorrencia;
  titulo: string;
  valor: number;
  dataReferencia: IsoDateString;
  categoria?: string;
  observacao?: string;
}

export interface MetaMensal {
  id: 'meta-mensal';
  valor: number;
  mesReferencia: `${number}-${number}`;
  atualizadaEm: string;
}

export interface PreferenciasOnboarding {
  concluido: boolean;
  concluidoEm?: string;
}
