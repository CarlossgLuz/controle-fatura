import {
  LEDGER_CIVIL_YEAR_MAX,
  LEDGER_CIVIL_YEAR_MIN,
  LedgerValidationError,
  allocateInstallments,
  calculateStatementCycle,
  confirmedExpenseTotalMinor,
  createCardPurchase,
  createCardTermsRevision,
  createConfirmedMovement,
  createInvoicePayment,
  createLedgerCategory,
  createLedgerSource,
  createLedgerWriteContext,
  createStatementCycleReference,
  resolveCardTerms,
  type CardPurchaseInput,
  type CardTermsRevision,
  type InvoicePaymentInput,
  type LedgerOperation,
  type LedgerValidationCode,
  type LedgerWriteContext,
} from '@/domain/v2';

function expectLedgerError(action: () => unknown, code: LedgerValidationCode): void {
  expect(action).toThrow(expect.objectContaining<Partial<LedgerValidationError>>({ code }));
}

const checking = createLedgerSource('account', 'checking-main', 'BRL');
const cash = createLedgerSource('cash', 'wallet', 'BRL');
const card = createLedgerSource('card', 'card-main', 'BRL');
const otherCard = createLedgerSource('card', 'card-other', 'BRL');
const usdAccount = createLedgerSource('account', 'checking-usd', 'USD');
const archivedCard = createLedgerSource('card', 'card-archived', 'BRL', false);
const archivedAccount = createLedgerSource('account', 'account-archived', 'BRL', false);

const salary = createLedgerCategory('income', 'salary');
const food = createLedgerCategory('expense', 'food');
const travel = createLedgerCategory('expense', 'travel');
const archivedExpense = createLedgerCategory('expense', 'expense-archived', false);

const context = createLedgerWriteContext({
  sources: [checking, cash, card, otherCard, usdAccount, archivedCard, archivedAccount],
  categories: [salary, food, travel, archivedExpense],
  statementCycles: [
    createStatementCycleReference(card.id, '2026-08'),
    createStatementCycleReference(card.id, '2027-01'),
    createStatementCycleReference(card.id, '2027-02'),
    createStatementCycleReference(card.id, '2027-03'),
    createStatementCycleReference(otherCard.id, '2028-01'),
  ],
});

function terms(
  overrides: Partial<{
    cardId: string;
    revision: number;
    effectiveFrom: string;
    closingDay: number;
    dueDay: number;
    cycleRuleVersion: string;
    timeZone: string;
  }> = {}
): CardTermsRevision {
  return createCardTermsRevision({
    cardId: card.id,
    revision: 1,
    effectiveFrom: '2026-01-01',
    closingDay: 10,
    dueDay: 20,
    cycleRuleVersion: 'calendar-v1',
    timeZone: 'America/Sao_Paulo',
    ...overrides,
  });
}

function purchaseInput(overrides: Partial<CardPurchaseInput> = {}): CardPurchaseInput {
  return {
    operationId: 'op-purchase-1',
    id: 'purchase-1',
    amountMinor: 10_001,
    occurredOn: '2026-12-20',
    card,
    categoryId: travel.id,
    terms: [terms()],
    installmentCount: 3,
    ...overrides,
  };
}

function paymentInput(overrides: Partial<InvoicePaymentInput> = {}): InvoicePaymentInput {
  return {
    operationId: 'op-payment-1',
    id: 'payment-1',
    amountMinor: 5_000,
    occurredOn: '2027-01-20',
    source: checking,
    destination: card,
    settlesStatementCycleKey: '2027-01',
    ...overrides,
  };
}

describe('catalog-backed ledger sources and confirmed movements', () => {
  it.each(['BRL', 'USD', 'EUR'])('accepts supported ISO currency %s', (currency) => {
    expect(createLedgerSource('cash', `source-${currency}`, currency).currency).toBe(currency);
  });

  it.each(['ZZZ', 'R$', ''])('rejects unsupported currency %p', (currency) => {
    expectLedgerError(
      () => createLedgerSource('account', 'unsupported-currency', currency),
      'invalid-currency'
    );
  });

  it('models income destination, expense source and transfer endpoints through the catalog', () => {
    const income = createConfirmedMovement(
      {
        id: 'income-1',
        kind: 'income',
        amountMinor: 25_000,
        occurredOn: '2026-08-17',
        destination: checking,
        categoryId: salary.id,
      },
      context
    );
    const expense = createConfirmedMovement(
      {
        id: 'expense-1',
        kind: 'expense',
        amountMinor: 1_250,
        occurredOn: '2026-08-17',
        source: cash,
        categoryId: food.id,
      },
      context
    );
    const transfer = createConfirmedMovement(
      {
        id: 'transfer-1',
        kind: 'transfer',
        amountMinor: 5_000,
        occurredOn: '2026-08-17',
        source: checking,
        destination: cash,
      },
      context
    );

    expect(income).toMatchObject({ kind: 'income', destination: checking });
    expect(expense).toMatchObject({ kind: 'expense', source: cash });
    expect(transfer).toMatchObject({ kind: 'transfer', source: checking, destination: cash });
  });

  it('rejects missing, archived or mismatched source references', () => {
    expectLedgerError(
      () =>
        createConfirmedMovement(
          {
            id: 'expense-missing-source',
            kind: 'expense',
            amountMinor: 100,
            occurredOn: '2026-08-17',
            source: createLedgerSource('cash', 'not-registered', 'BRL'),
            categoryId: food.id,
          },
          context
        ),
      'source-not-found'
    );
    expectLedgerError(
      () =>
        createConfirmedMovement(
          {
            id: 'expense-archived-source',
            kind: 'expense',
            amountMinor: 100,
            occurredOn: '2026-08-17',
            source: archivedAccount,
            categoryId: food.id,
          },
          context
        ),
      'source-inactive'
    );
    expectLedgerError(
      () =>
        createConfirmedMovement(
          {
            id: 'expense-mismatched-source',
            kind: 'expense',
            amountMinor: 100,
            occurredOn: '2026-08-17',
            source: { ...cash, kind: 'account' },
            categoryId: food.id,
          },
          context
        ),
      'source-mismatch'
    );
  });

  it('rejects missing, archived or semantically incompatible categories', () => {
    const expense = (categoryId: string) =>
      createConfirmedMovement(
        {
          id: `expense-${categoryId}`,
          kind: 'expense',
          amountMinor: 100,
          occurredOn: '2026-08-17',
          source: cash,
          categoryId,
        },
        context
      );

    expectLedgerError(() => expense('missing-category'), 'category-not-found');
    expectLedgerError(() => expense(archivedExpense.id), 'category-inactive');
    expectLedgerError(() => expense(salary.id), 'category-mismatch');
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects non-positive or unsafe amount %p',
    (amountMinor) => {
      expectLedgerError(
        () =>
          createConfirmedMovement(
            {
              id: 'invalid-amount',
              kind: 'expense',
              amountMinor,
              occurredOn: '2026-08-17',
              source: cash,
              categoryId: food.id,
            },
            context
          ),
        'invalid-amount'
      );
    }
  );

  it('rejects transfers with the same source id or different currencies', () => {
    expectLedgerError(
      () =>
        createConfirmedMovement(
          {
            id: 'transfer-same',
            kind: 'transfer',
            amountMinor: 100,
            occurredOn: '2026-08-17',
            source: checking,
            destination: checking,
          },
          context
        ),
      'same-source'
    );
    expectLedgerError(
      () =>
        createConfirmedMovement(
          {
            id: 'transfer-fx',
            kind: 'transfer',
            amountMinor: 100,
            occurredOn: '2026-08-17',
            source: checking,
            destination: usdAccount,
          },
          context
        ),
      'currency-mismatch'
    );
  });

  it('enforces the explicit civil-year range without Date.UTC year coercion', () => {
    const movementAt = (occurredOn: string) =>
      createConfirmedMovement(
        {
          id: `expense-${occurredOn}`,
          kind: 'expense',
          amountMinor: 100,
          occurredOn,
          source: cash,
          categoryId: food.id,
        },
        context
      );

    expect(movementAt(`${LEDGER_CIVIL_YEAR_MIN}-01-01`).occurredOn).toBe('1000-01-01');
    expect(movementAt(`${LEDGER_CIVIL_YEAR_MAX}-12-31`).occurredOn).toBe('9999-12-31');
    expectLedgerError(() => movementAt('0099-01-01'), 'date-out-of-range');
    expectLedgerError(() => movementAt('02026-01-01'), 'invalid-date');
    expectLedgerError(() => movementAt('10000-01-01'), 'date-out-of-range');
    expectLedgerError(() => movementAt('2026-02-29'), 'invalid-date');
  });
});

describe('versioned card terms, timezone and statement cycles', () => {
  it('stores an explicit validated IANA timezone in terms and cycle snapshot', () => {
    const cycle = calculateStatementCycle('2026-12-20', terms());
    expect(cycle).toEqual({
      statementCycleKey: '2027-01',
      periodStartsOn: '2026-12-11',
      closesOn: '2027-01-10',
      dueOn: '2027-01-20',
      cycleRuleRevision: 1,
      cycleRuleVersion: 'calendar-v1',
      timeZone: 'America/Sao_Paulo',
    });
    expectLedgerError(() => terms({ timeZone: 'Mars/Olympus_Mons' }), 'invalid-time-zone');
  });

  it.each([
    ['2027-01-20', '2027-02-28'],
    ['2028-01-20', '2028-02-29'],
  ])('clamps day 31 to the last applicable February day', (occurredOn, dueOn) => {
    expect(
      calculateStatementCycle(
        occurredOn,
        terms({ effectiveFrom: '2027-01-01', closingDay: 31, dueDay: 31 })
      ).dueOn
    ).toBe(dueOn);
  });

  it.each([28, 29, 30, 31])(
    'assigns dates before/on/after closing day %i deterministically',
    (closingDay) => {
      const rule = terms({ closingDay, dueDay: 20 });
      const before = `2026-03-${String(closingDay - 1).padStart(2, '0')}`;
      const on = `2026-03-${closingDay}`;
      const after = closingDay === 31 ? '2026-04-01' : `2026-03-${closingDay + 1}`;

      expect(calculateStatementCycle(before, rule).statementCycleKey).toBe('2026-03');
      expect(calculateStatementCycle(on, rule).statementCycleKey).toBe('2026-03');
      expect(calculateStatementCycle(after, rule).statementCycleKey).toBe('2026-04');
    }
  );

  it('uses leap day as a valid purchase date', () => {
    expect(
      calculateStatementCycle(
        '2028-02-29',
        terms({ effectiveFrom: '2028-01-01', closingDay: 31, dueDay: 5 })
      )
    ).toMatchObject({
      statementCycleKey: '2028-02',
      closesOn: '2028-02-29',
      dueOn: '2028-03-05',
    });
  });

  it('does not produce civil dates or cycle keys in year 10000', () => {
    expectLedgerError(
      () =>
        calculateStatementCycle(
          '9999-12-31',
          terms({ effectiveFrom: '9999-01-01', closingDay: 30, dueDay: 31 })
        ),
      'date-out-of-range'
    );
    expectLedgerError(() => allocateInstallments(100, 2, '9999-12', 1), 'date-out-of-range');
  });

  it('selects effective terms and freezes the historical cycle snapshot', () => {
    const revision1 = terms();
    const historical = createCardPurchase(
      purchaseInput({
        operationId: 'op-purchase-old',
        id: 'purchase-old',
        amountMinor: 10_000,
        occurredOn: '2026-02-12',
        terms: [revision1],
        installmentCount: undefined,
      }),
      context,
      []
    ).value;
    const revision2 = terms({
      revision: 2,
      effectiveFrom: '2026-04-01',
      closingDay: 20,
      dueDay: 28,
      cycleRuleVersion: 'calendar-v2',
      timeZone: 'UTC',
    });
    const current = createCardPurchase(
      purchaseInput({
        operationId: 'op-purchase-new',
        id: 'purchase-new',
        amountMinor: 10_000,
        occurredOn: '2026-04-21',
        terms: [revision1, revision2],
        installmentCount: undefined,
      }),
      context,
      []
    ).value;

    expect(historical.movement.statementCycle).toMatchObject({
      statementCycleKey: '2026-03',
      cycleRuleRevision: 1,
      timeZone: 'America/Sao_Paulo',
    });
    expect(current.movement.statementCycle).toMatchObject({
      statementCycleKey: '2026-05',
      cycleRuleRevision: 2,
      timeZone: 'UTC',
    });
    expect(Object.isFrozen(historical.movement.statementCycle)).toBe(true);
  });

  it('rejects invalid or unavailable card terms', () => {
    expectLedgerError(
      () => createCardTermsRevision({ ...terms(), revision: 0 }),
      'invalid-card-terms'
    );
    expectLedgerError(() => resolveCardTerms(card.id, '2025-12-31', [terms()]), 'missing-card-terms');
  });
});

describe('card purchases and deterministic installment allocations', () => {
  it('keeps one expense on the purchase date and applies the normative remainder to the first allocation', () => {
    const plan = createCardPurchase(purchaseInput(), context, []).value;

    expect(plan.movement).toMatchObject({
      kind: 'expense',
      amountMinor: 10_001,
      occurredOn: '2026-12-20',
    });
    expect(plan.allocations.map(({ amountMinor }) => amountMinor)).toEqual([3_335, 3_333, 3_333]);
    expect(plan.allocations.map(({ statementCycleKey }) => statementCycleKey)).toEqual([
      '2027-01',
      '2027-02',
      '2027-03',
    ]);
  });

  it.each(Array.from({ length: 35 }, (_, index) => index + 2))(
    'allocates exactly the total for %i installments',
    (installmentCount) => {
      const allocations = allocateInstallments(10_001, installmentCount, '2026-01', 1);
      expect(allocations).toHaveLength(installmentCount);
      expect(allocations.reduce((sum, allocation) => sum + allocation.amountMinor, 0)).toBe(10_001);
      expect(allocations.every((allocation) => allocation.amountMinor > 0)).toBe(true);
    }
  );

  it('preserves exact allocation at Number.MAX_SAFE_INTEGER', () => {
    const allocations = allocateInstallments(Number.MAX_SAFE_INTEGER, 36, '2026-01', 1);
    expect(allocations.reduce((sum, allocation) => sum + allocation.amountMinor, 0)).toBe(
      Number.MAX_SAFE_INTEGER
    );
  });

  it.each([1, 37, 2.5])('rejects installment count %p', (installmentCount) => {
    expectLedgerError(
      () => allocateInstallments(10_000, installmentCount, '2026-01', 1),
      'invalid-installment-count'
    );
  });

  it('rejects a plan that would create a non-positive allocation', () => {
    expectLedgerError(
      () => allocateInstallments(2, 3, '2026-01', 1),
      'invalid-installment-amount'
    );
  });

  it('requires active card and compatible active category references', () => {
    expectLedgerError(
      () =>
        createCardPurchase(
          purchaseInput({
            operationId: 'op-archived-card',
            id: 'purchase-archived-card',
            card: archivedCard,
            terms: [terms({ cardId: archivedCard.id })],
          }),
          context,
          []
        ),
      'source-inactive'
    );
    expectLedgerError(
      () =>
        createCardPurchase(
          purchaseInput({
            operationId: 'op-archived-category',
            id: 'purchase-archived-category',
            categoryId: archivedExpense.id,
          }),
          context,
          []
        ),
      'category-inactive'
    );
    expectLedgerError(
      () =>
        createCardPurchase(
          purchaseInput({
            operationId: 'op-wrong-category',
            id: 'purchase-wrong-category',
            categoryId: salary.id,
          }),
          context,
          []
        ),
      'category-mismatch'
    );
  });

  it('replays identical operationId/payload and conflicts on divergent payload', () => {
    const input = purchaseInput({ operationId: 'op-idempotent-purchase' });
    const created = createCardPurchase(input, context, []);
    const replayed = createCardPurchase(input, context, created.operations);

    expect(created.status).toBe('created');
    expect(replayed.status).toBe('replayed');
    expect(replayed.value).toBe(created.value);
    expect(replayed.operations).toBe(created.operations);
    expect(replayed.operations).toHaveLength(1);
    expectLedgerError(
      () => createCardPurchase({ ...input, amountMinor: input.amountMinor + 1 }, context, created.operations),
      'idempotency-conflict'
    );
  });

  it('requires a non-empty purchase operationId', () => {
    expectLedgerError(
      () => createCardPurchase(purchaseInput({ operationId: ' ' }), context, []),
      'invalid-operation-id'
    );
  });
});

describe('invoice payments, cycle ownership and expense totals', () => {
  it.each([checking, cash])('creates payment from active account/cash as transfer', (source) => {
    expect(
      createInvoicePayment(
        paymentInput({
          operationId: `op-payment-${source.kind}`,
          id: `payment-${source.kind}`,
          source,
        }),
        context,
        []
      ).value
    ).toMatchObject({
      kind: 'transfer',
      source,
      destination: card,
      settlesStatementCycleKey: '2027-01',
    });
  });

  it('rejects routes other than account/cash to card and archived endpoints', () => {
    expectLedgerError(
      () =>
        createInvoicePayment(
          paymentInput({ source: card, destination: checking }),
          context,
          []
        ),
      'invalid-invoice-payment'
    );
    expectLedgerError(
      () => createInvoicePayment(paymentInput({ destination: cash }), context, []),
      'invalid-invoice-payment'
    );
    expectLedgerError(
      () => createInvoicePayment(paymentInput({ source: archivedAccount }), context, []),
      'source-inactive'
    );
    expectLedgerError(
      () => createInvoicePayment(paymentInput({ destination: archivedCard }), context, []),
      'source-inactive'
    );
  });

  it('validates that a linked cycle exists and belongs to the destination card', () => {
    expectLedgerError(
      () =>
        createInvoicePayment(
          paymentInput({ settlesStatementCycleKey: '2028-01' }),
          context,
          []
        ),
      'cycle-card-mismatch'
    );
    expectLedgerError(
      () =>
        createInvoicePayment(
          paymentInput({ settlesStatementCycleKey: '2030-01' }),
          context,
          []
        ),
      'statement-cycle-not-found'
    );
  });

  it('replays identical payment operation and conflicts on divergent payload', () => {
    const input = paymentInput({ operationId: 'op-idempotent-payment' });
    const created = createInvoicePayment(input, context, []);
    const replayed = createInvoicePayment(input, context, created.operations);

    expect(replayed.status).toBe('replayed');
    expect(replayed.value).toBe(created.value);
    expect(replayed.operations).toHaveLength(1);
    expectLedgerError(
      () => createInvoicePayment({ ...input, amountMinor: 5_001 }, context, created.operations),
      'idempotency-conflict'
    );
    expectLedgerError(
      () =>
        createCardPurchase(
          purchaseInput({ operationId: input.operationId }),
          context,
          created.operations
        ),
      'idempotency-conflict'
    );
  });

  it('requires a non-empty payment operationId', () => {
    expectLedgerError(
      () => createInvoicePayment(paymentInput({ operationId: '' }), context, []),
      'invalid-operation-id'
    );
  });

  it('keeps one expense with partial and multiple invoice payments', () => {
    const purchase = createCardPurchase(
      purchaseInput({
        operationId: 'op-purchase-total',
        id: 'purchase-total',
        amountMinor: 30_000,
      }),
      context,
      []
    );
    const partial = createInvoicePayment(
      paymentInput({
        operationId: 'op-payment-partial-1',
        id: 'payment-partial-1',
        amountMinor: 7_500,
      }),
      context,
      purchase.operations
    );
    const another = createInvoicePayment(
      paymentInput({
        operationId: 'op-payment-partial-2',
        id: 'payment-partial-2',
        amountMinor: 12_500,
      }),
      context,
      partial.operations
    );

    expect(another.operations).toHaveLength(3);
    expect(
      confirmedExpenseTotalMinor([purchase.value.movement, partial.value, another.value])
    ).toBe(30_000);
  });

  it('detects expense aggregation overflow past Number.MAX_SAFE_INTEGER', () => {
    const maximum = createConfirmedMovement(
      {
        id: 'expense-max',
        kind: 'expense',
        amountMinor: Number.MAX_SAFE_INTEGER,
        occurredOn: '2026-08-17',
        source: cash,
        categoryId: food.id,
      },
      context
    );
    const one = createConfirmedMovement(
      {
        id: 'expense-one',
        kind: 'expense',
        amountMinor: 1,
        occurredOn: '2026-08-17',
        source: cash,
        categoryId: food.id,
      },
      context
    );

    expectLedgerError(() => confirmedExpenseTotalMinor([maximum, one]), 'total-overflow');
  });

  it('rejects duplicated operation history as invalid state', () => {
    const created = createInvoicePayment(paymentInput(), context, []);
    const duplicated = [created.operations[0], created.operations[0]] as readonly LedgerOperation[];
    expectLedgerError(
      () => createInvoicePayment(paymentInput(), context, duplicated),
      'invalid-operation-history'
    );
  });
});
