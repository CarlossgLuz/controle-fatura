import type { Category } from '@/domain/finance/types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'income-salary', name: 'Salário', kind: 'income', system: true, active: true },
  { id: 'income-freelance', name: 'Freela', kind: 'income', system: true, active: true },
  { id: 'expense-food', name: 'Alimentação', kind: 'expense', system: true, active: true },
  { id: 'expense-transport', name: 'Transporte', kind: 'expense', system: true, active: true },
  { id: 'expense-housing', name: 'Moradia', kind: 'expense', system: true, active: true },
  { id: 'expense-health', name: 'Saúde', kind: 'expense', system: true, active: true },
  { id: 'expense-education', name: 'Educação', kind: 'expense', system: true, active: true },
  { id: 'expense-leisure', name: 'Lazer', kind: 'expense', system: true, active: true },
  { id: 'expense-subscriptions', name: 'Assinaturas', kind: 'expense', system: true, active: true },
  { id: 'expense-other', name: 'Outros', kind: 'expense', system: true, active: true },
];

export function listCategoriesByKind(
  categories: Category[],
  kind: Category['kind']
): Category[] {
  return categories.filter((category) => category.kind === kind && category.active);
}
