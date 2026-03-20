import { isValidDayOfMonth } from '@/domain/finance/rules';
import type { CardConfig } from '@/domain/finance/types';

export function editCardConfig(
  current: CardConfig,
  changes: Partial<Pick<CardConfig, 'name' | 'closingDay' | 'dueDay'>>
): CardConfig {
  const name = changes.name ?? current.name;
  const closingDay = changes.closingDay ?? current.closingDay;
  const dueDay = changes.dueDay ?? current.dueDay;

  if (name.trim().length === 0) {
    throw new Error('Nome do cartão é obrigatório.');
  }

  if (!isValidDayOfMonth(closingDay) || !isValidDayOfMonth(dueDay)) {
    throw new Error('Dias de fechamento e vencimento devem estar entre 1 e 31.');
  }

  return {
    ...current,
    ...changes,
  };
}
