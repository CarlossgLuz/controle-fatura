import { centsToLegacyAmount, positiveCents } from '@/domain/v2/money';

describe('positiveCents', () => {
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects %p',
    (value) => {
      expect(() => positiveCents(value)).toThrow(RangeError);
    }
  );

  it('keeps integer cents and converts only at the legacy boundary', () => {
    const value = positiveCents(12_345);
    expect(value).toBe(12_345);
    expect(centsToLegacyAmount(value)).toBe(123.45);
  });
});
