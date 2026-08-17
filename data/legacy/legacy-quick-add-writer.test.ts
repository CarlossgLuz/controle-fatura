import {
  LegacyQuickAddCompatibilityError,
  LegacyQuickAddWriter,
  type LegacyQuickAddDependencies,
} from '@/data/legacy/legacy-quick-add-writer';
import { validateQuickAddCommand, type QuickAddCommand } from '@/domain/v2';
import type { Transaction } from '@/domain/finance/types';

const input: QuickAddCommand = {
  operationId: 'op-legacy',
  kind: 'expense',
  amountCents: 10_001,
  occurredOn: '2026-08-17',
  sourceAccountId: 'card-main',
  categoryId: 'expense-other',
  description: 'Compra',
};

function transaction(id: string): Transaction {
  return {
    id,
    cardId: 'card-main',
    kind: 'expense',
    amount: 100.01,
    date: '2026-08-17',
    cycleId: '2026-08',
    categoryId: 'expense-other',
    description: 'Compra',
    source: 'manual',
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
  };
}

function dependencies(): jest.Mocked<LegacyQuickAddDependencies> {
  return {
    addTransaction: jest.fn().mockResolvedValue(transaction('txn-1')),
    addInstallmentTransaction: jest
      .fn()
      .mockResolvedValue([transaction('txn-1'), transaction('txn-2'), transaction('txn-3')]),
  };
}

describe('LegacyQuickAddWriter', () => {
  it('maps cents and an expense to the current repository contract', async () => {
    const deps = dependencies();
    const writer = new LegacyQuickAddWriter(deps);

    await expect(writer.write(validateQuickAddCommand(input))).resolves.toEqual({
      operationId: 'op-legacy',
      entityIds: ['txn-1'],
      persistenceModel: 'legacy-transaction',
    });
    expect(deps.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'op-legacy',
        amount: 100.01,
        kind: 'expense',
        recurringEntryId: undefined,
      })
    );
  });

  it('uses the isolated legacy installment path for compatibility', async () => {
    const deps = dependencies();
    const writer = new LegacyQuickAddWriter(deps);
    const command = validateQuickAddCommand({
      ...input,
      installments: { total: 3, current: 1 },
    });

    await expect(writer.write(command)).resolves.toMatchObject({
      entityIds: ['txn-1', 'txn-2', 'txn-3'],
      persistenceModel: 'legacy-installment-series',
    });
    expect(deps.addInstallmentTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100.01 }),
      3,
      1
    );
  });

  it('maps income and propagates persistence failures', async () => {
    const deps = dependencies();
    deps.addTransaction.mockRejectedValueOnce(new Error('write failed'));
    const writer = new LegacyQuickAddWriter(deps);

    await expect(
      writer.write(validateQuickAddCommand({ ...input, kind: 'income' }))
    ).rejects.toThrow('write failed');
    expect(deps.addTransaction).toHaveBeenCalledWith(expect.objectContaining({ kind: 'income' }));
  });

  it('fails closed for a source the legacy repository cannot represent', async () => {
    const writer = new LegacyQuickAddWriter(dependencies());
    const command = validateQuickAddCommand({ ...input, sourceAccountId: 'cash-main' });

    await expect(writer.write(command)).rejects.toBeInstanceOf(LegacyQuickAddCompatibilityError);
  });
});
