import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from './expense.dto.js';

const valid = { date: '2026-04-15', category: 'akofa', amount: 300_000, label: '3 charrettes' };

describe('createExpenseSchema', () => {
  it('defaults both links to null', () => {
    expect(createExpenseSchema.parse(valid)).toEqual({
      ...valid,
      kilnBatchId: null,
      riceFieldId: null,
    });
  });

  it.each([
    ['an unknown category', { category: 'salary' }],
    ['a zero amount', { amount: 0 }],
    ['a fractional amount', { amount: 100.5 }],
    ['a blank label', { label: ' ' }],
    ['a malformed batch id', { kilnBatchId: 'batch-1' }],
  ])('rejects %s', (_label, override) => {
    expect(createExpenseSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateExpenseSchema', () => {
  it('leaves out the links when only the amount changes, so a fix never detaches a batch', () => {
    expect(updateExpenseSchema.parse({ amount: 320_000 })).toEqual({ amount: 320_000 });
  });

  it('detaches a batch with kilnBatchId: null', () => {
    expect(updateExpenseSchema.parse({ kilnBatchId: null })).toEqual({ kilnBatchId: null });
  });

  it('rejects an empty body', () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(false);
  });
});

describe('listExpensesQuerySchema', () => {
  it('accepts no filter at all and a category filter', () => {
    expect(listExpensesQuerySchema.parse({})).toEqual({});
    expect(listExpensesQuerySchema.parse({ category: 'fuel' })).toEqual({ category: 'fuel' });
  });

  it('rejects an unknown category', () => {
    expect(listExpensesQuerySchema.safeParse({ category: 'salary' }).success).toBe(false);
  });
});
