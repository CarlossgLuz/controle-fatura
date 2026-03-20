import { CARTAO_PADRAO, type CategoriaCompra, type NovaCompraInput, type Parcela } from '@/domain/types';
import { parseCurrencyInput } from '@/utils/currency-input';

export interface CompraFormValues {
  valor: string;
  dataCompra: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaCompra;
  parcelaAtual: string;
  parcelaTotal: string;
}

export interface CompraFormErrors {
  valor?: string;
  dataCompra?: string;
  titulo?: string;
  categoria?: string;
  parcela?: string;
}

export interface CompraFormValidationResult {
  isValid: boolean;
  errors: CompraFormErrors;
  value?: NovaCompraInput;
}

export const CATEGORIAS_COMPRA: CategoriaCompra[] = [
  'alimentacao',
  'transporte',
  'moradia',
  'saude',
  'educacao',
  'lazer',
  'assinaturas',
  'outros',
];

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

function parseParcela(atualRaw: string, totalRaw: string): { parcela?: Parcela; error?: string } {
  const atualVazio = atualRaw.trim().length === 0;
  const totalVazio = totalRaw.trim().length === 0;

  if (atualVazio && totalVazio) {
    return {};
  }

  if (atualVazio || totalVazio) {
    return { error: 'Informe parcela atual e total.' };
  }

  const atual = Number(atualRaw);
  const total = Number(totalRaw);
  const inteiroValido =
    Number.isInteger(atual) && Number.isInteger(total) && atual > 0 && total > 0 && atual <= total;

  if (!inteiroValido) {
    return { error: 'Parcela deve ser um inteiro válido (ex: 1 de 3).' };
  }

  return { parcela: { atual, total } };
}

export function buildDefaultCompraFormValues(today: Date = new Date()): CompraFormValues {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return {
    valor: '',
    dataCompra: `${year}-${month}-${day}`,
    titulo: '',
    descricao: '',
    categoria: 'outros',
    parcelaAtual: '',
    parcelaTotal: '',
  };
}

export function validateCompraForm(values: CompraFormValues): CompraFormValidationResult {
  const errors: CompraFormErrors = {};
  const valor = parseCurrencyInput(values.valor);
  const titulo = values.titulo.trim();
  const descricao = values.descricao.trim();

  if (!Number.isFinite(valor) || valor <= 0) {
    errors.valor = 'Informe um valor válido maior que zero.';
  }

  if (!isIsoDate(values.dataCompra)) {
    errors.dataCompra = 'Informe a data no formato YYYY-MM-DD.';
  }

  if (titulo.length === 0) {
    errors.titulo = 'Título é obrigatório.';
  }

  if (!CATEGORIAS_COMPRA.includes(values.categoria)) {
    errors.categoria = 'Categoria inválida.';
  }

  const parcelaResult = parseParcela(values.parcelaAtual, values.parcelaTotal);
  if (parcelaResult.error) {
    errors.parcela = parcelaResult.error;
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    value: {
      cartaoId: CARTAO_PADRAO.id,
      valor,
      dataCompra: values.dataCompra as NovaCompraInput['dataCompra'],
      parcela: parcelaResult.parcela,
      titulo,
      descricao: descricao.length > 0 ? descricao : undefined,
      local: titulo,
      categoria: values.categoria,
    },
  };
}
