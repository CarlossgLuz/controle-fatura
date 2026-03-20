import { isValidAmount, isValidMonthKey } from '@/domain/finance/rules';
import type { BudgetConfig, MonthKey } from '@/domain/finance/types';

export function createBudgetConfig(month: MonthKey, targetAmount: number, now: Date = new Date()): BudgetConfig {
  if (!isValidMonthKey(month)) {
    throw new Error('Mês de orçamento inválido.');
  }

  if (!isValidAmount(targetAmount)) {
    throw new Error('Meta mensal inválida.');
  }

  return {
    id: 'budget-main',
    month,
    targetAmount,
    updatedAt: now.toISOString(),
  };
}

export function editBudgetConfig(
  current: BudgetConfig,
  changes: Partial<Pick<BudgetConfig, 'month' | 'targetAmount'>>,
  now: Date = new Date()
): BudgetConfig {
  const month = changes.month ?? current.month;
  const targetAmount = changes.targetAmount ?? current.targetAmount;

  if (!isValidMonthKey(month)) {
    throw new Error('Mês de orçamento inválido.');
  }

  if (!isValidAmount(targetAmount)) {
    throw new Error('Meta mensal inválida.');
  }

  return {
    ...current,
    ...changes,
    updatedAt: now.toISOString(),
  };
}
