import type { QuickAddWriter, QuickAddWriteResult } from '@/application/quick-add/ports';
import {
  validateQuickAddCommand,
  type QuickAddCommand,
  type ValidatedQuickAddCommand,
} from '@/domain/v2';

interface PendingSubmission {
  fingerprint: string;
  promise: Promise<QuickAddWriteResult>;
}

interface CompletedSubmission {
  fingerprint: string;
  result: QuickAddWriteResult;
}

export class QuickAddOperationConflictError extends Error {
  readonly code = 'QUICK_ADD_OPERATION_CONFLICT';

  constructor(operationId: string) {
    super(`Operation ${operationId} was already used with a different payload.`);
    this.name = 'QuickAddOperationConflictError';
  }
}

function fingerprint(command: ValidatedQuickAddCommand): string {
  return JSON.stringify({
    kind: command.kind,
    amountCents: Number(command.amountCents),
    occurredOn: command.occurredOn,
    sourceAccountId: command.sourceAccountId,
    categoryId: command.categoryId,
    description: command.description,
    notes: command.notes ?? null,
    installments: command.installments ?? null,
  });
}

export class SubmitQuickAdd {
  private readonly pending = new Map<string, PendingSubmission>();
  private readonly completed = new Map<string, CompletedSubmission>();

  constructor(private readonly writer: QuickAddWriter) {}

  execute(command: QuickAddCommand): Promise<QuickAddWriteResult> {
    const validated = validateQuickAddCommand(command);
    const commandFingerprint = fingerprint(validated);
    const completed = this.completed.get(validated.operationId);
    if (completed) {
      if (completed.fingerprint !== commandFingerprint) {
        return Promise.reject(new QuickAddOperationConflictError(validated.operationId));
      }
      return Promise.resolve(completed.result);
    }

    const existing = this.pending.get(validated.operationId);
    if (existing) {
      if (existing.fingerprint !== commandFingerprint) {
        return Promise.reject(new QuickAddOperationConflictError(validated.operationId));
      }
      return existing.promise;
    }

    const pending = this.writer.write(validated).then(
      (result) => {
        this.pending.delete(validated.operationId);
        this.completed.set(validated.operationId, {
          fingerprint: commandFingerprint,
          result,
        });
        return result;
      },
      (error: unknown) => {
        this.pending.delete(validated.operationId);
        throw error;
      }
    );

    this.pending.set(validated.operationId, {
      fingerprint: commandFingerprint,
      promise: pending,
    });
    return pending;
  }
}
