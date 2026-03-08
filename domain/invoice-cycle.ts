import type { CicloFatura, CicloFaturaId, ConfiguracaoCartao, IsoDateString } from '@/domain/types';

type DateInput = Date | IsoDateString;

function toLocalDate(input: DateInput): Date {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 12, 0, 0, 0);
  }

  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDay(year: number, monthIndex: number, day: number): number {
  return Math.min(Math.max(day, 1), daysInMonth(year, monthIndex));
}

function dateWithClampedDay(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, clampDay(year, monthIndex, day), 12, 0, 0, 0);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return new Date(next.getFullYear(), next.getMonth(), next.getDate(), 12, 0, 0, 0);
}

export function toIsoDate(date: Date): IsoDateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as IsoDateString;
}

export function cicloIdFromFechamento(fechamento: Date): CicloFaturaId {
  const year = fechamento.getFullYear();
  const month = String(fechamento.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}` as CicloFaturaId;
}

export function calcularCicloPorDataCompra(
  dataCompra: DateInput,
  cartao: ConfiguracaoCartao
): CicloFatura {
  const compra = toLocalDate(dataCompra);
  const compraDia = compra.getDate();

  const fechamentoMes = compraDia <= cartao.fechamentoDia ? compra.getMonth() : compra.getMonth() + 1;
  const fechamentoAno =
    fechamentoMes > 11 ? compra.getFullYear() + 1 : compra.getFullYear();
  const fechamentoMesAjustado = fechamentoMes > 11 ? 0 : fechamentoMes;

  const fechamento = dateWithClampedDay(fechamentoAno, fechamentoMesAjustado, cartao.fechamentoDia);
  const fechamentoAnterior = dateWithClampedDay(
    fechamento.getMonth() === 0 ? fechamento.getFullYear() - 1 : fechamento.getFullYear(),
    fechamento.getMonth() === 0 ? 11 : fechamento.getMonth() - 1,
    cartao.fechamentoDia
  );

  const inicio = addDays(fechamentoAnterior, 1);
  const fim = fechamento;

  const vencimentoMes =
    cartao.vencimentoDia > cartao.fechamentoDia ? fechamento.getMonth() : fechamento.getMonth() + 1;
  const vencimentoAno =
    vencimentoMes > 11 ? fechamento.getFullYear() + 1 : fechamento.getFullYear();
  const vencimentoMesAjustado = vencimentoMes > 11 ? 0 : vencimentoMes;

  const vencimento = dateWithClampedDay(vencimentoAno, vencimentoMesAjustado, cartao.vencimentoDia);

  return {
    id: cicloIdFromFechamento(fechamento),
    inicio: toIsoDate(inicio),
    fim: toIsoDate(fim),
    fechamento: toIsoDate(fechamento),
    vencimento: toIsoDate(vencimento),
  };
}

export function calcularCicloAtual(dataReferencia: DateInput, cartao: ConfiguracaoCartao): CicloFatura {
  return calcularCicloPorDataCompra(dataReferencia, cartao);
}

export function pertenceAoCiclo(data: DateInput, ciclo: CicloFatura): boolean {
  const target = toLocalDate(data).getTime();
  const inicio = toLocalDate(ciclo.inicio).getTime();
  const fim = toLocalDate(ciclo.fim).getTime();
  return target >= inicio && target <= fim;
}
