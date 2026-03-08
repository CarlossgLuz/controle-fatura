import type { IsoDateString } from '@/domain/types';
import type { CardConfig, InvoiceCycle } from '@/domain/finance/types';

function toLocalDate(input: Date | IsoDateString): Date {
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

function dateWithDay(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, clampDay(year, monthIndex, day), 12, 0, 0, 0);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return new Date(next.getFullYear(), next.getMonth(), next.getDate(), 12, 0, 0, 0);
}

function toIsoDate(date: Date): IsoDateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as IsoDateString;
}

function cycleIdFromClosing(closing: Date): InvoiceCycle['id'] {
  const year = closing.getFullYear();
  const month = String(closing.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}` as InvoiceCycle['id'];
}

export function calculateInvoiceCycleByDate(
  purchaseDate: Date | IsoDateString,
  card: CardConfig
): InvoiceCycle {
  const date = toLocalDate(purchaseDate);
  const purchaseDay = date.getDate();

  const closingMonthRaw = purchaseDay <= card.closingDay ? date.getMonth() : date.getMonth() + 1;
  const closingYear = closingMonthRaw > 11 ? date.getFullYear() + 1 : date.getFullYear();
  const closingMonth = closingMonthRaw > 11 ? 0 : closingMonthRaw;

  const closing = dateWithDay(closingYear, closingMonth, card.closingDay);
  const previousClosing = dateWithDay(
    closing.getMonth() === 0 ? closing.getFullYear() - 1 : closing.getFullYear(),
    closing.getMonth() === 0 ? 11 : closing.getMonth() - 1,
    card.closingDay
  );

  const start = addDays(previousClosing, 1);
  const end = closing;

  const dueMonthRaw = card.dueDay > card.closingDay ? closing.getMonth() : closing.getMonth() + 1;
  const dueYear = dueMonthRaw > 11 ? closing.getFullYear() + 1 : closing.getFullYear();
  const dueMonth = dueMonthRaw > 11 ? 0 : dueMonthRaw;
  const due = dateWithDay(dueYear, dueMonth, card.dueDay);

  return {
    id: cycleIdFromClosing(closing),
    start: toIsoDate(start),
    end: toIsoDate(end),
    closing: toIsoDate(closing),
    due: toIsoDate(due),
  };
}

export function calculateCurrentInvoiceCycle(reference: Date | IsoDateString, card: CardConfig): InvoiceCycle {
  return calculateInvoiceCycleByDate(reference, card);
}

export function belongsToInvoiceCycle(date: Date | IsoDateString, cycle: InvoiceCycle): boolean {
  const value = toLocalDate(date).getTime();
  const start = toLocalDate(cycle.start).getTime();
  const end = toLocalDate(cycle.end).getTime();
  return value >= start && value <= end;
}
