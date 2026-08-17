import AsyncStorage from 'expo-sqlite/kv-store';

import {
  addInstallmentTransaction,
  addTransaction,
  TransactionOperationConflictError,
} from '@/data/local/finance-repository';
import { DEFAULT_CARD_CONFIG, type NewTransactionInput } from '@/domain/finance/types';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const storage = new Map<string, string>();
const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function resolveStorageValue(
  key: string,
  value: string | ((previous: string | null) => string)
): string {
  return typeof value === 'function' ? value(storage.get(key) ?? null) : value;
}

const input: NewTransactionInput = {
  operationId: 'op-durable-1',
  cardId: DEFAULT_CARD_CONFIG.id,
  kind: 'expense',
  amount: 100.01,
  date: '2026-08-17',
  categoryId: 'expense-other',
  description: 'Compra sintética',
};

beforeEach(() => {
  storage.clear();
  jest.clearAllMocks();
  mockedStorage.getItem.mockImplementation(async (key) => storage.get(key) ?? null);
  mockedStorage.setItem.mockImplementation(async (key, value) => {
    storage.set(key, resolveStorageValue(key, value));
  });
  mockedStorage.removeItem.mockImplementation(async (key) => {
    storage.delete(key);
  });
});

describe('finance repository operation idempotency', () => {
  it('returns the persisted transaction for the same operation ID', async () => {
    const first = await addTransaction(input);
    const second = await addTransaction(input);

    expect(second.id).toBe(first.id);
    expect(second.operationId).toBe(input.operationId);
    expect(JSON.parse(storage.get('finance.transactions.v1') ?? '[]')).toHaveLength(1);
  });

  it('recovers without duplication when storage committed before reporting an error', async () => {
    mockedStorage.setItem.mockImplementationOnce(async (key, value) => {
      storage.set(key, resolveStorageValue(key, value));
      throw new Error('ambiguous storage result');
    });

    await expect(addTransaction(input)).rejects.toThrow('ambiguous storage result');
    await expect(addTransaction(input)).resolves.toMatchObject({ operationId: input.operationId });
    expect(JSON.parse(storage.get('finance.transactions.v1') ?? '[]')).toHaveLength(1);
  });

  it('rejects reuse of an operation ID with a different payload', async () => {
    await addTransaction(input);
    await expect(addTransaction({ ...input, amount: 200 })).rejects.toBeInstanceOf(
      TransactionOperationConflictError
    );
  });

  it('returns the same complete legacy installment group on retry', async () => {
    const first = await addInstallmentTransaction(input, 3, 1);
    const second = await addInstallmentTransaction(input, 3, 1);

    expect(second.map((entry) => entry.id)).toEqual(first.map((entry) => entry.id));
    expect(second).toHaveLength(3);
    expect(second.reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0)).toBe(10_001);
    expect(JSON.parse(storage.get('finance.transactions.v1') ?? '[]')).toHaveLength(3);
  });
});
