import type { Category } from '@/domain/finance/types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'income-salary', name: 'Salário', kind: 'income', usage: 'all', system: true, active: true },
  { id: 'income-freelance', name: 'Freela', kind: 'income', usage: 'all', system: true, active: true },
  { id: 'expense-food', name: 'Alimentação', kind: 'expense', usage: 'all', system: true, active: true },
  { id: 'expense-transport', name: 'Transporte', kind: 'expense', usage: 'all', system: true, active: true },
  { id: 'expense-housing', name: 'Moradia', kind: 'expense', usage: 'fixed', system: true, active: true },
  { id: 'expense-health', name: 'Saúde', kind: 'expense', usage: 'all', system: true, active: true },
  { id: 'expense-education', name: 'Educação', kind: 'expense', usage: 'all', system: true, active: true },
  { id: 'expense-leisure', name: 'Lazer', kind: 'expense', usage: 'variable', system: true, active: true },
  {
    id: 'expense-subscriptions',
    name: 'Assinaturas',
    kind: 'expense',
    usage: 'fixed',
    system: true,
    active: true,
  },
  { id: 'expense-other', name: 'Outros', kind: 'expense', usage: 'all', system: true, active: true },
];

export function listCategoriesByKind(
  categories: Category[],
  kind: Category['kind']
): Category[] {
  return categories.filter((category) => category.kind === kind && category.active);
}

export function listCategoriesByUsage(
  categories: Category[],
  usage: 'income' | 'expense' | 'fixed'
): Category[] {
  if (usage === 'income') {
    return categories.filter((entry) => entry.active && entry.kind === 'income');
  }

  if (usage === 'fixed') {
    return categories.filter(
      (entry) => entry.active && entry.kind === 'expense' && entry.usage !== 'variable'
    );
  }

  return categories.filter(
    (entry) => entry.active && entry.kind === 'expense' && entry.usage !== 'fixed'
  );
}
