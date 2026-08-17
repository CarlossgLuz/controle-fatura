import { positiveCents, type PositiveCents } from '@/domain/v2/money';

export const LEDGER_CIVIL_YEAR_MIN = 1000;
export const LEDGER_CIVIL_YEAR_MAX = 9999;
export const SUPPORTED_LEDGER_CURRENCIES = ['BRL', 'USD', 'EUR'] as const;

export type LedgerCivilDate = `${number}-${number}-${number}`;
export type StatementCycleKey = `${number}-${number}`;
export type SupportedLedgerCurrency = (typeof SUPPORTED_LEDGER_CURRENCIES)[number];
export type LedgerSourceKind = 'account' | 'cash' | 'card';
export type ConfirmedMovementKind = 'income' | 'expense' | 'transfer';
export type LedgerCategoryKind = 'income' | 'expense';

export interface LedgerSource {
  readonly id: string;
  readonly kind: LedgerSourceKind;
  readonly currency: SupportedLedgerCurrency;
  readonly active: boolean;
}

export interface LedgerCategory {
  readonly id: string;
  readonly kind: LedgerCategoryKind;
  readonly active: boolean;
}

export interface StatementCycleReference {
  readonly cardId: string;
  readonly statementCycleKey: StatementCycleKey;
}

export interface LedgerWriteContext {
  readonly sources: readonly LedgerSource[];
  readonly categories: readonly LedgerCategory[];
  readonly statementCycles: readonly StatementCycleReference[];
}

interface MovementBase {
  readonly id: string;
  readonly amountMinor: PositiveCents;
  readonly occurredOn: LedgerCivilDate;
}

export interface IncomeMovement extends MovementBase {
  readonly kind: 'income';
  readonly destination: LedgerSource;
  readonly categoryId: string;
}

export interface ExpenseMovement extends MovementBase {
  readonly kind: 'expense';
  readonly source: LedgerSource;
  readonly categoryId: string;
}

export interface TransferMovement extends MovementBase {
  readonly kind: 'transfer';
  readonly source: LedgerSource;
  readonly destination: LedgerSource;
}

export type ConfirmedMovement = IncomeMovement | ExpenseMovement | TransferMovement;

export interface IncomeMovementInput {
  readonly id: string;
  readonly kind: 'income';
  readonly amountMinor: number;
  readonly occurredOn: string;
  readonly destination: LedgerSource;
  readonly categoryId: string;
}

export interface ExpenseMovementInput {
  readonly id: string;
  readonly kind: 'expense';
  readonly amountMinor: number;
  readonly occurredOn: string;
  readonly source: LedgerSource;
  readonly categoryId: string;
}

export interface TransferMovementInput {
  readonly id: string;
  readonly kind: 'transfer';
  readonly amountMinor: number;
  readonly occurredOn: string;
  readonly source: LedgerSource;
  readonly destination: LedgerSource;
}

export type ConfirmedMovementInput =
  | IncomeMovementInput
  | ExpenseMovementInput
  | TransferMovementInput;

export interface CardTermsRevision {
  readonly cardId: string;
  readonly revision: number;
  readonly effectiveFrom: LedgerCivilDate;
  readonly closingDay: number;
  readonly dueDay: number;
  readonly cycleRuleVersion: string;
  readonly timeZone: string;
}

export interface CardTermsRevisionInput {
  readonly cardId: string;
  readonly revision: number;
  readonly effectiveFrom: string;
  readonly closingDay: number;
  readonly dueDay: number;
  readonly cycleRuleVersion: string;
  readonly timeZone: string;
}

export interface StatementCycleSnapshot {
  readonly statementCycleKey: StatementCycleKey;
  readonly periodStartsOn: LedgerCivilDate;
  readonly closesOn: LedgerCivilDate;
  readonly dueOn: LedgerCivilDate;
  readonly cycleRuleRevision: number;
  readonly cycleRuleVersion: string;
  readonly timeZone: string;
}

export interface CardPurchaseMovement extends ExpenseMovement {
  readonly source: LedgerSource & { readonly kind: 'card' };
  readonly statementCycle: StatementCycleSnapshot;
}

export interface InstallmentAllocation {
  readonly index: number;
  readonly total: number;
  readonly amountMinor: PositiveCents;
  readonly statementCycleKey: StatementCycleKey;
  readonly cycleRuleRevision: number;
}

export interface CardPurchasePlan {
  readonly movement: CardPurchaseMovement;
  readonly allocations: readonly InstallmentAllocation[];
}

export interface CardPurchaseInput {
  readonly operationId: string;
  readonly id: string;
  readonly amountMinor: number;
  readonly occurredOn: string;
  readonly card: LedgerSource;
  readonly categoryId: string;
  readonly terms: readonly CardTermsRevision[];
  readonly installmentCount?: number;
}

export interface InvoicePayment extends TransferMovement {
  readonly source: LedgerSource & { readonly kind: 'account' | 'cash' };
  readonly destination: LedgerSource & { readonly kind: 'card' };
  readonly settlesStatementCycleKey?: StatementCycleKey;
}

export interface InvoicePaymentInput {
  readonly operationId: string;
  readonly id: string;
  readonly amountMinor: number;
  readonly occurredOn: string;
  readonly source: LedgerSource;
  readonly destination: LedgerSource;
  readonly settlesStatementCycleKey?: string;
}

export interface CardPurchaseOperation {
  readonly kind: 'card-purchase';
  readonly operationId: string;
  readonly payloadKey: string;
  readonly result: CardPurchasePlan;
}

export interface InvoicePaymentOperation {
  readonly kind: 'invoice-payment';
  readonly operationId: string;
  readonly payloadKey: string;
  readonly result: InvoicePayment;
}

export type LedgerOperation = CardPurchaseOperation | InvoicePaymentOperation;

export interface IdempotentCommandResult<T> {
  readonly status: 'created' | 'replayed';
  readonly value: T;
  readonly operations: readonly LedgerOperation[];
}

export type LedgerValidationCode =
  | 'invalid-source'
  | 'source-not-found'
  | 'source-inactive'
  | 'source-mismatch'
  | 'invalid-currency'
  | 'invalid-id'
  | 'invalid-operation-id'
  | 'idempotency-conflict'
  | 'invalid-operation-history'
  | 'invalid-amount'
  | 'invalid-date'
  | 'date-out-of-range'
  | 'invalid-category'
  | 'category-not-found'
  | 'category-inactive'
  | 'category-mismatch'
  | 'invalid-movement-kind'
  | 'same-source'
  | 'currency-mismatch'
  | 'invalid-card-terms'
  | 'missing-card-terms'
  | 'invalid-time-zone'
  | 'invalid-installment-count'
  | 'invalid-installment-amount'
  | 'invalid-cycle-key'
  | 'statement-cycle-not-found'
  | 'cycle-card-mismatch'
  | 'invalid-invoice-payment'
  | 'invalid-write-context'
  | 'total-overflow';

export class LedgerValidationError extends Error {
  constructor(readonly code: LedgerValidationCode) {
    super(code);
    this.name = 'LedgerValidationError';
  }
}

interface CivilParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function nonEmpty(value: unknown, code: LedgerValidationCode): string {
  if (typeof value !== 'string' || !value.trim()) throw new LedgerValidationError(code);
  return value.trim();
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parsedCivilDate(value: string): CivilParts {
  const shape = /^(\d+)-(\d{2})-(\d{2})$/.exec(value);
  if (!shape) throw new LedgerValidationError('invalid-date');

  const [yearText] = shape.slice(1);
  const parsedYear = Number(yearText);
  if (yearText.length !== 4) {
    if (parsedYear < LEDGER_CIVIL_YEAR_MIN || parsedYear > LEDGER_CIVIL_YEAR_MAX) {
      throw new LedgerValidationError('date-out-of-range');
    }
    throw new LedgerValidationError('invalid-date');
  }

  const year = parsedYear;
  const month = Number(shape[2]);
  const day = Number(shape[3]);
  if (year < LEDGER_CIVIL_YEAR_MIN || year > LEDGER_CIVIL_YEAR_MAX) {
    throw new LedgerValidationError('date-out-of-range');
  }
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new LedgerValidationError('invalid-date');
  }

  return { year, month, day };
}

function civilDate(value: string): LedgerCivilDate {
  parsedCivilDate(value);
  return value as LedgerCivilDate;
}

function formatCivilDate(parts: CivilParts): LedgerCivilDate {
  if (parts.year < LEDGER_CIVIL_YEAR_MIN || parts.year > LEDGER_CIVIL_YEAR_MAX) {
    throw new LedgerValidationError('date-out-of-range');
  }
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(
    parts.day
  ).padStart(2, '0')}` as LedgerCivilDate;
}

function dateWithClampedDay(year: number, month: number, day: number): LedgerCivilDate {
  return formatCivilDate({ year, month, day: Math.min(day, daysInMonth(year, month)) });
}

function shiftMonth(year: number, month: number, amount: number): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + amount;
  const shifted = { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
  if (shifted.year < LEDGER_CIVIL_YEAR_MIN || shifted.year > LEDGER_CIVIL_YEAR_MAX) {
    throw new LedgerValidationError('date-out-of-range');
  }
  return shifted;
}

function addCivilDays(value: LedgerCivilDate, amount: number): LedgerCivilDate {
  if (!Number.isInteger(amount)) throw new LedgerValidationError('invalid-date');
  let current = parsedCivilDate(value);
  const direction = Math.sign(amount);

  for (let remaining = Math.abs(amount); remaining > 0; remaining -= 1) {
    if (direction > 0) {
      if (current.day < daysInMonth(current.year, current.month)) {
        current = { ...current, day: current.day + 1 };
      } else {
        const next = shiftMonth(current.year, current.month, 1);
        current = { ...next, day: 1 };
      }
    } else if (current.day > 1) {
      current = { ...current, day: current.day - 1 };
    } else {
      const previous = shiftMonth(current.year, current.month, -1);
      current = { ...previous, day: daysInMonth(previous.year, previous.month) };
    }
  }

  return formatCivilDate(current);
}

function statementCycleKey(year: number, month: number): StatementCycleKey {
  if (year < LEDGER_CIVIL_YEAR_MIN || year > LEDGER_CIVIL_YEAR_MAX) {
    throw new LedgerValidationError('date-out-of-range');
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}` as StatementCycleKey;
}

function assertCycleKey(value: string): StatementCycleKey {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) throw new LedgerValidationError('invalid-cycle-key');
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < LEDGER_CIVIL_YEAR_MIN || year > LEDGER_CIVIL_YEAR_MAX) {
    throw new LedgerValidationError('date-out-of-range');
  }
  if (month < 1 || month > 12) throw new LedgerValidationError('invalid-cycle-key');
  return value as StatementCycleKey;
}

function addCycleMonths(value: StatementCycleKey, amount: number): StatementCycleKey {
  const [year, month] = value.split('-').map(Number);
  const shifted = shiftMonth(year, month, amount);
  return statementCycleKey(shifted.year, shifted.month);
}

function amountMinor(value: number): PositiveCents {
  try {
    return positiveCents(value);
  } catch {
    throw new LedgerValidationError('invalid-amount');
  }
}

function supportedCurrency(value: string): SupportedLedgerCurrency {
  const currency = nonEmpty(value, 'invalid-currency').toUpperCase();
  if (!(SUPPORTED_LEDGER_CURRENCIES as readonly string[]).includes(currency)) {
    throw new LedgerValidationError('invalid-currency');
  }
  return currency as SupportedLedgerCurrency;
}

function canonicalTimeZone(value: string): string {
  const timeZone = nonEmpty(value, 'invalid-time-zone');
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone;
  } catch {
    throw new LedgerValidationError('invalid-time-zone');
  }
}

function normalizedSource(source: LedgerSource): LedgerSource {
  if (!source || !['account', 'cash', 'card'].includes(source.kind)) {
    throw new LedgerValidationError('invalid-source');
  }
  if (typeof source.active !== 'boolean') throw new LedgerValidationError('invalid-source');

  return Object.freeze({
    id: nonEmpty(source.id, 'invalid-source'),
    kind: source.kind,
    currency: supportedCurrency(source.currency),
    active: source.active,
  });
}

function normalizedCategory(category: LedgerCategory): LedgerCategory {
  if (!category || !['income', 'expense'].includes(category.kind)) {
    throw new LedgerValidationError('invalid-category');
  }
  if (typeof category.active !== 'boolean') throw new LedgerValidationError('invalid-category');
  return Object.freeze({
    id: nonEmpty(category.id, 'invalid-category'),
    kind: category.kind,
    active: category.active,
  });
}

function normalizedCycleReference(reference: StatementCycleReference): StatementCycleReference {
  return Object.freeze({
    cardId: nonEmpty(reference.cardId, 'invalid-source'),
    statementCycleKey: assertCycleKey(reference.statementCycleKey),
  });
}

function assertUnique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) {
    throw new LedgerValidationError('invalid-write-context');
  }
}

export function createLedgerSource(
  kind: LedgerSourceKind,
  id: string,
  currency: string,
  active = true
): LedgerSource {
  return normalizedSource({ kind, id, currency: currency as SupportedLedgerCurrency, active });
}

export function createLedgerCategory(
  kind: LedgerCategoryKind,
  id: string,
  active = true
): LedgerCategory {
  return normalizedCategory({ kind, id, active });
}

export function createStatementCycleReference(
  cardId: string,
  cycleKey: string
): StatementCycleReference {
  return normalizedCycleReference({ cardId, statementCycleKey: cycleKey as StatementCycleKey });
}

export function createLedgerWriteContext(input: LedgerWriteContext): LedgerWriteContext {
  if (!input || !Array.isArray(input.sources) || !Array.isArray(input.categories)) {
    throw new LedgerValidationError('invalid-write-context');
  }
  if (!Array.isArray(input.statementCycles)) {
    throw new LedgerValidationError('invalid-write-context');
  }

  const sources = input.sources.map(normalizedSource);
  const categories = input.categories.map(normalizedCategory);
  const statementCycles = input.statementCycles.map(normalizedCycleReference);
  assertUnique(sources.map(({ id }) => id));
  assertUnique(categories.map(({ id }) => id));
  assertUnique(statementCycles.map(({ cardId, statementCycleKey: key }) => `${cardId}\u0000${key}`));

  return Object.freeze({
    sources: Object.freeze(sources),
    categories: Object.freeze(categories),
    statementCycles: Object.freeze(statementCycles),
  });
}

function activeSource(source: LedgerSource, context: LedgerWriteContext): LedgerSource {
  const candidate = normalizedSource(source);
  const matches = context.sources.filter(({ id }) => id === candidate.id);
  if (!matches[0]) throw new LedgerValidationError('source-not-found');
  if (matches.length !== 1) throw new LedgerValidationError('invalid-write-context');

  const registered = normalizedSource(matches[0]);
  if (!registered.active) throw new LedgerValidationError('source-inactive');
  if (registered.kind !== candidate.kind || registered.currency !== candidate.currency) {
    throw new LedgerValidationError('source-mismatch');
  }
  return registered;
}

function activeCategory(
  categoryId: string,
  kind: LedgerCategoryKind,
  context: LedgerWriteContext
): LedgerCategory {
  const id = nonEmpty(categoryId, 'invalid-category');
  const matches = context.categories.filter((category) => category.id === id);
  if (!matches[0]) throw new LedgerValidationError('category-not-found');
  if (matches.length !== 1) throw new LedgerValidationError('invalid-write-context');

  const category = normalizedCategory(matches[0]);
  if (!category.active) throw new LedgerValidationError('category-inactive');
  if (category.kind !== kind) throw new LedgerValidationError('category-mismatch');
  return category;
}

function commonMovement(input: ConfirmedMovementInput): MovementBase {
  return {
    id: nonEmpty(input.id, 'invalid-id'),
    amountMinor: amountMinor(input.amountMinor),
    occurredOn: civilDate(input.occurredOn),
  };
}

function assertTransferSources(source: LedgerSource, destination: LedgerSource): void {
  if (source.id === destination.id) throw new LedgerValidationError('same-source');
  if (source.currency !== destination.currency) {
    throw new LedgerValidationError('currency-mismatch');
  }
}

export function createConfirmedMovement(
  input: IncomeMovementInput,
  context: LedgerWriteContext
): IncomeMovement;
export function createConfirmedMovement(
  input: ExpenseMovementInput,
  context: LedgerWriteContext
): ExpenseMovement;
export function createConfirmedMovement(
  input: TransferMovementInput,
  context: LedgerWriteContext
): TransferMovement;
export function createConfirmedMovement(
  input: ConfirmedMovementInput,
  context: LedgerWriteContext
): ConfirmedMovement {
  const writeContext = createLedgerWriteContext(context);
  const base = commonMovement(input);

  if (input.kind === 'income') {
    const category = activeCategory(input.categoryId, 'income', writeContext);
    return Object.freeze({
      ...base,
      kind: input.kind,
      destination: activeSource(input.destination, writeContext),
      categoryId: category.id,
    });
  }

  if (input.kind === 'expense') {
    const category = activeCategory(input.categoryId, 'expense', writeContext);
    return Object.freeze({
      ...base,
      kind: input.kind,
      source: activeSource(input.source, writeContext),
      categoryId: category.id,
    });
  }

  if (input.kind === 'transfer') {
    const source = activeSource(input.source, writeContext);
    const destination = activeSource(input.destination, writeContext);
    assertTransferSources(source, destination);
    return Object.freeze({ ...base, kind: input.kind, source, destination });
  }

  throw new LedgerValidationError('invalid-movement-kind');
}

export function createCardTermsRevision(input: CardTermsRevisionInput): CardTermsRevision {
  if (
    !Number.isSafeInteger(input.revision) ||
    input.revision < 1 ||
    !Number.isInteger(input.closingDay) ||
    input.closingDay < 1 ||
    input.closingDay > 31 ||
    !Number.isInteger(input.dueDay) ||
    input.dueDay < 1 ||
    input.dueDay > 31
  ) {
    throw new LedgerValidationError('invalid-card-terms');
  }

  return Object.freeze({
    cardId: nonEmpty(input.cardId, 'invalid-card-terms'),
    revision: input.revision,
    effectiveFrom: civilDate(input.effectiveFrom),
    closingDay: input.closingDay,
    dueDay: input.dueDay,
    cycleRuleVersion: nonEmpty(input.cycleRuleVersion, 'invalid-card-terms'),
    timeZone: canonicalTimeZone(input.timeZone),
  });
}

export function resolveCardTerms(
  cardId: string,
  occurredOn: string,
  revisions: readonly CardTermsRevision[]
): CardTermsRevision {
  const normalizedCardId = nonEmpty(cardId, 'invalid-source');
  const date = civilDate(occurredOn);
  const eligible = revisions
    .map((revision) => createCardTermsRevision(revision))
    .filter((revision) => revision.cardId === normalizedCardId && revision.effectiveFrom <= date)
    .sort(
      (left, right) =>
        right.effectiveFrom.localeCompare(left.effectiveFrom) || right.revision - left.revision
    );

  if (!eligible[0]) throw new LedgerValidationError('missing-card-terms');
  return eligible[0];
}

export function calculateStatementCycle(
  occurredOn: string,
  terms: CardTermsRevision
): StatementCycleSnapshot {
  const normalizedTerms = createCardTermsRevision(terms);
  const purchaseDate = civilDate(occurredOn);
  if (purchaseDate < normalizedTerms.effectiveFrom) {
    throw new LedgerValidationError('invalid-card-terms');
  }

  const purchase = parsedCivilDate(purchaseDate);
  const closingThisMonth = dateWithClampedDay(
    purchase.year,
    purchase.month,
    normalizedTerms.closingDay
  );
  const closingMonth =
    purchaseDate <= closingThisMonth
      ? { year: purchase.year, month: purchase.month }
      : shiftMonth(purchase.year, purchase.month, 1);
  const closesOn = dateWithClampedDay(
    closingMonth.year,
    closingMonth.month,
    normalizedTerms.closingDay
  );
  const previousClosingMonth = shiftMonth(closingMonth.year, closingMonth.month, -1);
  const previousClosesOn = dateWithClampedDay(
    previousClosingMonth.year,
    previousClosingMonth.month,
    normalizedTerms.closingDay
  );
  const dueMonth =
    normalizedTerms.dueDay > normalizedTerms.closingDay
      ? closingMonth
      : shiftMonth(closingMonth.year, closingMonth.month, 1);

  return Object.freeze({
    statementCycleKey: statementCycleKey(closingMonth.year, closingMonth.month),
    periodStartsOn: addCivilDays(previousClosesOn, 1),
    closesOn,
    dueOn: dateWithClampedDay(dueMonth.year, dueMonth.month, normalizedTerms.dueDay),
    cycleRuleRevision: normalizedTerms.revision,
    cycleRuleVersion: normalizedTerms.cycleRuleVersion,
    timeZone: normalizedTerms.timeZone,
  });
}

export function allocateInstallments(
  totalAmountMinor: number,
  installmentCount: number,
  firstStatementCycleKey: string,
  cycleRuleRevision: number
): readonly InstallmentAllocation[] {
  const total = amountMinor(totalAmountMinor);
  if (
    !Number.isInteger(installmentCount) ||
    installmentCount < 2 ||
    installmentCount > 36
  ) {
    throw new LedgerValidationError('invalid-installment-count');
  }
  if (total < installmentCount) throw new LedgerValidationError('invalid-installment-amount');
  if (!Number.isSafeInteger(cycleRuleRevision) || cycleRuleRevision < 1) {
    throw new LedgerValidationError('invalid-card-terms');
  }

  const firstCycle = assertCycleKey(firstStatementCycleKey);
  const base = Math.floor(total / installmentCount);
  const remainder = total % installmentCount;
  const allocations = Array.from({ length: installmentCount }, (_, offset) =>
    Object.freeze({
      index: offset + 1,
      total: installmentCount,
      amountMinor: positiveCents(base + (offset === 0 ? remainder : 0)),
      statementCycleKey: addCycleMonths(firstCycle, offset),
      cycleRuleRevision,
    })
  );

  return Object.freeze(allocations);
}

function operation(
  operationId: string,
  operations: readonly LedgerOperation[]
): LedgerOperation | undefined {
  if (!Array.isArray(operations)) throw new LedgerValidationError('invalid-operation-history');
  const matches = operations.filter((entry) => entry.operationId === operationId);
  if (matches.length > 1) throw new LedgerValidationError('invalid-operation-history');
  return matches[0];
}

function cardPurchasePayloadKey(input: CardPurchaseInput): string {
  const source = normalizedSource(input.card);
  return JSON.stringify([
    nonEmpty(input.id, 'invalid-id'),
    amountMinor(input.amountMinor),
    civilDate(input.occurredOn),
    source.id,
    source.kind,
    source.currency,
    nonEmpty(input.categoryId, 'invalid-category'),
    input.installmentCount ?? null,
  ]);
}

function invoicePaymentPayloadKey(input: InvoicePaymentInput): string {
  const source = normalizedSource(input.source);
  const destination = normalizedSource(input.destination);
  return JSON.stringify([
    nonEmpty(input.id, 'invalid-id'),
    amountMinor(input.amountMinor),
    civilDate(input.occurredOn),
    source.id,
    source.kind,
    source.currency,
    destination.id,
    destination.kind,
    destination.currency,
    input.settlesStatementCycleKey ? assertCycleKey(input.settlesStatementCycleKey) : null,
  ]);
}

function appendedOperations(
  operations: readonly LedgerOperation[],
  next: LedgerOperation
): readonly LedgerOperation[] {
  return Object.freeze([...operations, Object.freeze(next)]);
}

export function createCardPurchase(
  input: CardPurchaseInput,
  context: LedgerWriteContext,
  operations: readonly LedgerOperation[]
): IdempotentCommandResult<CardPurchasePlan> {
  const operationId = nonEmpty(input.operationId, 'invalid-operation-id');
  const payloadKey = cardPurchasePayloadKey(input);
  const previous = operation(operationId, operations);
  if (previous) {
    if (previous.kind !== 'card-purchase' || previous.payloadKey !== payloadKey) {
      throw new LedgerValidationError('idempotency-conflict');
    }
    return Object.freeze({ status: 'replayed', value: previous.result, operations });
  }

  const writeContext = createLedgerWriteContext(context);
  const source = activeSource(input.card, writeContext);
  if (source.kind !== 'card') throw new LedgerValidationError('invalid-source');

  const selectedTerms = resolveCardTerms(source.id, input.occurredOn, input.terms);
  const statementCycle = calculateStatementCycle(input.occurredOn, selectedTerms);
  const movement = createConfirmedMovement(
    {
      id: input.id,
      kind: 'expense',
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      source,
      categoryId: input.categoryId,
    },
    writeContext
  );
  const cardMovement: CardPurchaseMovement = Object.freeze({
    ...movement,
    source: source as LedgerSource & { readonly kind: 'card' },
    statementCycle,
  });
  const allocations =
    input.installmentCount === undefined
      ? Object.freeze([] as InstallmentAllocation[])
      : allocateInstallments(
          movement.amountMinor,
          input.installmentCount,
          statementCycle.statementCycleKey,
          selectedTerms.revision
        );
  const value = Object.freeze({ movement: cardMovement, allocations });
  const nextOperations = appendedOperations(operations, {
    kind: 'card-purchase',
    operationId,
    payloadKey,
    result: value,
  });

  return Object.freeze({ status: 'created', value, operations: nextOperations });
}

function assertPaymentCycle(
  cardId: string,
  cycleKey: StatementCycleKey,
  context: LedgerWriteContext
): void {
  const sameKey = context.statementCycles.filter(
    ({ statementCycleKey: registeredKey }) => registeredKey === cycleKey
  );
  if (sameKey.some((reference) => reference.cardId === cardId)) return;
  if (sameKey.length > 0) throw new LedgerValidationError('cycle-card-mismatch');
  throw new LedgerValidationError('statement-cycle-not-found');
}

export function createInvoicePayment(
  input: InvoicePaymentInput,
  context: LedgerWriteContext,
  operations: readonly LedgerOperation[]
): IdempotentCommandResult<InvoicePayment> {
  const operationId = nonEmpty(input.operationId, 'invalid-operation-id');
  const payloadKey = invoicePaymentPayloadKey(input);
  const previous = operation(operationId, operations);
  if (previous) {
    if (previous.kind !== 'invoice-payment' || previous.payloadKey !== payloadKey) {
      throw new LedgerValidationError('idempotency-conflict');
    }
    return Object.freeze({ status: 'replayed', value: previous.result, operations });
  }

  const writeContext = createLedgerWriteContext(context);
  const source = activeSource(input.source, writeContext);
  const destination = activeSource(input.destination, writeContext);
  if ((source.kind !== 'account' && source.kind !== 'cash') || destination.kind !== 'card') {
    throw new LedgerValidationError('invalid-invoice-payment');
  }

  const movement = createConfirmedMovement(
    {
      id: input.id,
      kind: 'transfer',
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      source,
      destination,
    },
    writeContext
  );
  const settlesStatementCycleKey = input.settlesStatementCycleKey
    ? assertCycleKey(input.settlesStatementCycleKey)
    : undefined;
  if (settlesStatementCycleKey) {
    assertPaymentCycle(destination.id, settlesStatementCycleKey, writeContext);
  }

  const value: InvoicePayment = Object.freeze({
    ...movement,
    source: source as LedgerSource & { readonly kind: 'account' | 'cash' },
    destination: destination as LedgerSource & { readonly kind: 'card' },
    settlesStatementCycleKey,
  });
  const nextOperations = appendedOperations(operations, {
    kind: 'invoice-payment',
    operationId,
    payloadKey,
    result: value,
  });

  return Object.freeze({ status: 'created', value, operations: nextOperations });
}

export function confirmedExpenseTotalMinor(movements: readonly ConfirmedMovement[]): number {
  return movements.reduce((total, movement) => {
    if (movement.kind !== 'expense') return total;
    const next = total + movement.amountMinor;
    if (!Number.isSafeInteger(next)) throw new LedgerValidationError('total-overflow');
    return next;
  }, 0);
}
