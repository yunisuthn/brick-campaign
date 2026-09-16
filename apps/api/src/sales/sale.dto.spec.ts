import { createSaleSchema, updateSaleSchema } from './sale.dto.js';

const valid = {
  clientId: '019930a0-0000-7000-8000-000000000001',
  date: '2026-08-01',
  orderedQuantity: 5000,
  unitPrice: 250,
};

describe('createSaleSchema', () => {
  it('takes what the client owes, and nothing about what came in', () => {
    expect(createSaleSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ['a malformed client id', { clientId: 'client-1' }],
    ['a zero quantity', { orderedQuantity: 0 }],
    ['a fractional price', { unitPrice: 250.5 }],
    ['a date that is not a calendar day', { date: '1 août 2026' }],
  ])('rejects %s', (_label, override) => {
    expect(createSaleSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it('ignores a payment offered here: instalments have their own route', () => {
    const parsed = createSaleSchema.parse({
      ...valid,
      payment: { paidOn: '2026-08-20', amountReceived: 1_250_000 },
    });
    expect(parsed).toEqual(valid);
  });
});

describe('updateSaleSchema', () => {
  it('touches only the field it is given', () => {
    expect(updateSaleSchema.parse({ unitPrice: 260 })).toEqual({ unitPrice: 260 });
  });

  it('rejects an empty body', () => {
    expect(updateSaleSchema.safeParse({}).success).toBe(false);
  });
});
