import { useMemo } from 'react';

import { type AppLanguage } from '@/data/local/app-settings';
import { useAppPreferences } from '@/providers/app-preferences-provider';

function dateFromIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(Date.UTC(year, month - 1, day));
}

export function useI18n() {
  const { language, setLanguagePreference, strings } = useAppPreferences();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language, {
        style: 'currency',
        currency: 'BRL',
      }),
    [language]
  );

  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [language]
  );

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        month: 'long',
        year: 'numeric',
      }),
    [language]
  );

  return {
    language,
    strings,
    setLanguagePreference,
    formatCurrency: (value: number) => currencyFormatter.format(value),
    formatIsoDate: (isoDate: string) => shortDateFormatter.format(dateFromIso(isoDate)),
    formatMonthLabel: (date: Date) => monthFormatter.format(date),
    resolveSignedAmount: (kind: 'income' | 'expense', amount: number) =>
      `${kind === 'income' ? '+' : '-'} ${currencyFormatter.format(amount)}`,
    formatPercent: (value: number) => `${Math.round(value * 100)}%`,
  };
}

export function supportedLanguages(): AppLanguage[] {
  return ['pt-BR', 'en', 'es'];
}
