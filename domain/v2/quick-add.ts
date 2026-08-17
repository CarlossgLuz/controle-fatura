import { positiveCents, type PositiveCents } from '@/domain/v2/money';

export type CivilDate = `${number}-${number}-${number}`;
export type QuickAddKind = 'expense' | 'income';

export interface QuickAddInstallments {
  total: number;
  current: number;
}

export interface QuickAddCommand {
  operationId: string;
  kind: QuickAddKind;
  amountCents: number;
  occurredOn: string;
  sourceAccountId: string;
  categoryId: string;
  description: string;
  notes?: string;
  installments?: QuickAddInstallments;
}

export interface ValidatedQuickAddCommand
  extends Omit<QuickAddCommand, 'amountCents' | 'occurredOn'> {
  amountCents: PositiveCents;
  occurredOn: CivilDate;
}

export type QuickAddValidationCode =
  | 'invalid-operation-id'
  | 'invalid-kind'
  | 'invalid-amount'
  | 'invalid-date'
  | 'invalid-source'
  | 'invalid-category'
  | 'invalid-description'
  | 'invalid-installments';

export class QuickAddValidationError extends Error {
  constructor(readonly code: QuickAddValidationCode) {
    super(code);
    this.name = 'QuickAddValidationError';
  }
}

function nonEmpty(value: string, code: QuickAddValidationCode): string {
  const normalized = value.trim();
  if (!normalized) throw new QuickAddValidationError(code);
  return normalized;
}

function isCivilDate(value: string): value is CivilDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateInstallments(
  kind: QuickAddKind,
  installments: QuickAddInstallments | undefined
): QuickAddInstallments | undefined {
  if (!installments) return undefined;

  if (
    kind !== 'expense' ||
    !Number.isInteger(installments.total) ||
    !Number.isInteger(installments.current) ||
    installments.total < 2 ||
    installments.total > 36 ||
    installments.current < 1 ||
    installments.current > installments.total
  ) {
    throw new QuickAddValidationError('invalid-installments');
  }

  return { total: installments.total, current: installments.current };
}

export function validateQuickAddCommand(command: QuickAddCommand): ValidatedQuickAddCommand {
  if (command.kind !== 'expense' && command.kind !== 'income') {
    throw new QuickAddValidationError('invalid-kind');
  }

  let amountCents: PositiveCents;
  try {
    amountCents = positiveCents(command.amountCents);
  } catch {
    throw new QuickAddValidationError('invalid-amount');
  }

  if (!isCivilDate(command.occurredOn)) {
    throw new QuickAddValidationError('invalid-date');
  }

  const notes = command.notes?.trim() || undefined;

  return {
    operationId: nonEmpty(command.operationId, 'invalid-operation-id'),
    kind: command.kind,
    amountCents,
    occurredOn: command.occurredOn,
    sourceAccountId: nonEmpty(command.sourceAccountId, 'invalid-source'),
    categoryId: nonEmpty(command.categoryId, 'invalid-category'),
    description: nonEmpty(command.description, 'invalid-description'),
    notes,
    installments: validateInstallments(command.kind, command.installments),
  };
}
