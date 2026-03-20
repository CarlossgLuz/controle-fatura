function stripToSupportedCurrencyChars(raw: string): string {
  return raw.replace(/[^\d.,]/g, '');
}

export function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function normalizeCurrencyInput(raw: string): string {
  const cleaned = stripToSupportedCurrencyChars(raw);
  if (!cleaned) {
    return '';
  }

  const lastSeparatorIndex = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  if (lastSeparatorIndex === -1) {
    return sanitizeDigits(cleaned);
  }

  const integerDigits = sanitizeDigits(cleaned.slice(0, lastSeparatorIndex));
  const decimalDigitsRaw = sanitizeDigits(cleaned.slice(lastSeparatorIndex + 1));
  const hasTrailingSeparator = lastSeparatorIndex === cleaned.length - 1;

  if (hasTrailingSeparator) {
    return `${integerDigits || '0'},`;
  }

  if (!decimalDigitsRaw) {
    return integerDigits || '0';
  }

  if (decimalDigitsRaw.length > 2) {
    return sanitizeDigits(cleaned);
  }

  return `${integerDigits || '0'},${decimalDigitsRaw.slice(0, 2)}`;
}

export function parseCurrencyInput(raw: string): number {
  const normalized = normalizeCurrencyInput(raw);
  if (!normalized) {
    return NaN;
  }

  const parsed = Number(normalized.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function formatCurrencyInput(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  return value.toFixed(2).replace('.', ',');
}
