import {
  QuickAddOperationConflictError,
  SubmitQuickAdd,
  type QuickAddWriter,
} from '@/application/quick-add';
import type { QuickAddCommand } from '@/domain/v2';

const command: QuickAddCommand = {
  operationId: 'op-1',
  kind: 'expense',
  amountCents: 1_000,
  occurredOn: '2026-08-17',
  sourceAccountId: 'card-main',
  categoryId: 'expense-other',
  description: 'Teste',
};

describe('SubmitQuickAdd', () => {
  it('coalesces repeated operation IDs in the same session', async () => {
    const writer: QuickAddWriter = {
      write: jest.fn().mockResolvedValue({
        operationId: 'op-1',
        entityIds: ['txn-1'],
        persistenceModel: 'legacy-transaction',
      }),
    };
    const submit = new SubmitQuickAdd(writer);

    const first = submit.execute(command);
    const second = submit.execute(command);

    await expect(first).resolves.toEqual(await second);
    await expect(submit.execute(command)).resolves.toMatchObject({ entityIds: ['txn-1'] });
    expect(writer.write).toHaveBeenCalledTimes(1);
  });

  it('rejects a reused operation ID with a different payload', async () => {
    const writer: QuickAddWriter = {
      write: jest.fn().mockResolvedValue({
        operationId: 'op-1',
        entityIds: ['txn-1'],
        persistenceModel: 'legacy-transaction',
      }),
    };
    const submit = new SubmitQuickAdd(writer);

    await submit.execute(command);

    await expect(
      submit.execute({ ...command, description: 'different payload' })
    ).rejects.toBeInstanceOf(QuickAddOperationConflictError);
    expect(writer.write).toHaveBeenCalledTimes(1);
  });

  it('allows a retry after a writer failure', async () => {
    const writer: QuickAddWriter = {
      write: jest
        .fn()
        .mockRejectedValueOnce(new Error('storage unavailable'))
        .mockResolvedValueOnce({
          operationId: 'op-1',
          entityIds: ['txn-1'],
          persistenceModel: 'legacy-transaction',
        }),
    };
    const submit = new SubmitQuickAdd(writer);

    await expect(submit.execute(command)).rejects.toThrow('storage unavailable');
    await expect(submit.execute(command)).resolves.toMatchObject({ entityIds: ['txn-1'] });
    expect(writer.write).toHaveBeenCalledTimes(2);
  });
});
