export type IsoDateString = `${number}-${number}-${number}`;

export type CategoriaCompra =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'assinaturas'
  | 'outros';

export type CicloFaturaId = `${number}-${number}`;

export interface ConfiguracaoCartao {
  id: 'cartao-principal';
  nome: string;
  fechamentoDia: number;
  vencimentoDia: number;
}

export interface Parcela {
  atual: number;
  total: number;
}

export interface CicloFatura {
  id: CicloFaturaId;
  inicio: IsoDateString;
  fim: IsoDateString;
  fechamento: IsoDateString;
  vencimento: IsoDateString;
}

export interface Compra {
  id: string;
  cartaoId: ConfiguracaoCartao['id'];
  cicloId: CicloFaturaId;
  valor: number;
  dataCompra: IsoDateString;
  parcela?: Parcela;
  titulo: string;
  descricao?: string;
  local: string;
  categoria: CategoriaCompra;
  criadoEm: string;
  atualizadoEm: string;
}

export type NovaCompraInput = Omit<Compra, 'id' | 'cicloId' | 'criadoEm' | 'atualizadoEm'>;

export type EdicaoCompraInput = Partial<
  Pick<Compra, 'valor' | 'dataCompra' | 'parcela' | 'titulo' | 'descricao' | 'local' | 'categoria'>
>;

export const CARTAO_PADRAO: ConfiguracaoCartao = {
  id: 'cartao-principal',
  nome: 'Cartao principal',
  fechamentoDia: 5,
  vencimentoDia: 8,
};
