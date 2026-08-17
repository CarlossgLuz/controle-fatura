declare const positiveCentsBrand: unique symbol;

export type PositiveCents = number & { readonly [positiveCentsBrand]: true };

export function positiveCents(value: number): PositiveCents {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError('Amount must be a positive safe integer in cents.');
  }

  return value as PositiveCents;
}

export function centsToLegacyAmount(value: PositiveCents): number {
  return value / 100;
}
