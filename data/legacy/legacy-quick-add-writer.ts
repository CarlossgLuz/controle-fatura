import { SubmitQuickAdd, type QuickAddWriter, type QuickAddWriteResult } from '@/application/quick-add';
import {
  addInstallmentTransaction,
  addTransaction,
} from '@/data/local/finance-repository';
import { centsToLegacyAmount, type ValidatedQuickAddCommand } from '@/domain/v2';
import { DEFAULT_CARD_CONFIG, type NewTransactionInput, type Transaction } from '@/domain/finance/types';

export interface LegacyQuickAddDependencies {
  addTransaction(input: NewTransactionInput): Promise<Transaction>;
  addInstallmentTransaction(
    input: NewTransactionInput,
    installmentTotal: number,
    installmentCurrent: number
  ): Promise<Transaction[]>;
}

const defaultDependencies: LegacyQuickAddDependencies = {
  addTransaction,
  addInstallmentTransaction,
};

export class LegacyQuickAddCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LegacyQuickAddCompatibilityError';
  }
}

/**
 * Temporary bridge to the v1 KV repository. Installments still become multiple
 * legacy transactions here. This is intentionally not the v2 card-allocation
 * model and must be removed only after the guarded data migration is approved.
 */
export class LegacyQuickAddWriter implements QuickAddWriter {
  constructor(private readonly dependencies: LegacyQuickAddDependencies = defaultDependencies) {}

  async write(command: ValidatedQuickAddCommand): Promise<QuickAddWriteResult> {
    if (command.sourceAccountId !== DEFAULT_CARD_CONFIG.id) {
      throw new LegacyQuickAddCompatibilityError('Legacy storage supports only the default card.');
    }

    const input: NewTransactionInput = {
      operationId: command.operationId,
      cardId: DEFAULT_CARD_CONFIG.id,
      kind: command.kind,
      amount: centsToLegacyAmount(command.amountCents),
      date: command.occurredOn,
      categoryId: command.categoryId,
      description: command.description,
      notes: command.notes,
      recurringEntryId: undefined,
    };

    if (command.installments) {
      const created = await this.dependencies.addInstallmentTransaction(
        input,
        command.installments.total,
        command.installments.current
      );
      return {
        operationId: command.operationId,
        entityIds: created.map((entry) => entry.id),
        persistenceModel: 'legacy-installment-series',
      };
    }

    const created = await this.dependencies.addTransaction(input);
    return {
      operationId: command.operationId,
      entityIds: [created.id],
      persistenceModel: 'legacy-transaction',
    };
  }
}

export const legacyQuickAddWriter = new LegacyQuickAddWriter();
export const submitLegacyQuickAdd = new SubmitQuickAdd(legacyQuickAddWriter);
