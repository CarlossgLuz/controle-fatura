export function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatCurrencyDisplay(rawDigits: string): string {
  const digits = sanitizeDigits(rawDigits);
  if (!digits) return '';

  const cents = parseInt(digits, 10);
  if (!cents) return '';

  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const withThousands = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${withThousands},${String(centavos).padStart(2, '0')}`;
}

export function parseCurrencyDigits(rawDigits: string): number {
  const digits = sanitizeDigits(rawDigits);
  if (!digits) return NaN;

  const cents = parseInt(digits, 10);
  return Number.isFinite(cents) && cents > 0 ? cents / 100 : NaN;
}

export function toCentsDigits(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Math.round(value * 100));
}

export function parseCurrencyInput(raw: string): number {
  const hasCommaOrDot = /[,.]/.test(raw);
  if (hasCommaOrDot) {
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const value = Number(normalized);
    return Number.isFinite(value) && value > 0 ? value : NaN;
  }

  return parseCurrencyDigits(raw);
}

export function formatCurrencyInput(value: number): string {
  return toCentsDigits(value);
}

export function normalizeCurrencyInput(raw: string): string {
  return sanitizeDigits(raw);
}
