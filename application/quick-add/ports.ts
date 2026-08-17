import type { ValidatedQuickAddCommand } from '@/domain/v2';

export interface QuickAddWriteResult {
  operationId: string;
  entityIds: string[];
  persistenceModel: 'legacy-transaction' | 'legacy-installment-series';
}

export interface QuickAddWriter {
  write(command: ValidatedQuickAddCommand): Promise<QuickAddWriteResult>;
}
