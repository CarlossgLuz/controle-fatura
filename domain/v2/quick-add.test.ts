import { QuickAddValidationError, validateQuickAddCommand, type QuickAddCommand } from '@/domain/v2';

const validCommand: QuickAddCommand = {
  operationId: 'op-1',
  kind: 'expense',
  amountCents: 12_345,
  occurredOn: '2026-08-17',
  sourceAccountId: 'card-main',
  categoryId: 'expense-other',
  description: ' Mercado ',
  notes: ' nota ',
};

describe('validateQuickAddCommand', () => {
  it('normalizes text and preserves canonical cents/date', () => {
    expect(validateQuickAddCommand(validCommand)).toMatchObject({
      amountCents: 12_345,
      occurredOn: '2026-08-17',
      description: 'Mercado',
      notes: 'nota',
    });
  });

  it.each([
    [{ ...validCommand, amountCents: 0 }, 'invalid-amount'],
    [{ ...validCommand, amountCents: 10.5 }, 'invalid-amount'],
    [{ ...validCommand, occurredOn: '2026-02-30' }, 'invalid-date'],
    [{ ...validCommand, operationId: ' ' }, 'invalid-operation-id'],
    [{ ...validCommand, sourceAccountId: '' }, 'invalid-source'],
    [{ ...validCommand, categoryId: '' }, 'invalid-category'],
    [{ ...validCommand, description: ' ' }, 'invalid-description'],
    [{ ...validCommand, installments: { total: 37, current: 1 } }, 'invalid-installments'],
    [
      { ...validCommand, kind: 'income' as const, installments: { total: 2, current: 1 } },
      'invalid-installments',
    ],
  ] satisfies [QuickAddCommand, QuickAddValidationError['code']][])('rejects invalid command as %s', (command, code) => {
    expect(() => validateQuickAddCommand(command)).toThrow(
      expect.objectContaining({ code })
    );
  });
});
