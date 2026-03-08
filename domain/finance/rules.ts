import type { CardConfig, CardId, MonthKey } from '@/domain/finance/types';

export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}

export function isValidDayOfMonth(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

export function isValidMonthKey(month: string): month is MonthKey {
  return /^\d{4}-\d{2}$/.test(month);
}

export function assertSingleCard(cardId: CardId, config: CardConfig): void {
  if (cardId !== config.id) {
    throw new Error('Apenas um cartão é permitido neste app.');
  }
}

export function assertNonEmptyText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} é obrigatório.`);
  }
}
