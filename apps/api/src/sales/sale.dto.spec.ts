import { createSaleSchema, updateSaleSchema } from './sale.dto.js';

const valid = {
  clientId: '019930a0-0000-7000-8000-000000000001',
  date: '2026-08-01',
  orderedQuantity: 5000,
  unitPrice: 250,
};

describe('createSaleSchema', () => {
  it('defaults the payment to null: the sale is created unpaid', () => {
    expect(createSaleSchema.parse(valid)).toEqual({ ...valid, payment: null });
  });

  it('accepts a payment with both a date and an amount', () => {
    const payment = { paidOn: '2026-08-20', amountReceived: 1_250_000 };
    expect(createSaleSchema.parse({ ...valid, payment })).toEqual({ ...valid, payment });
  });

  it.each([
    ['a malformed client id', { clientId: 'client-1' }],
    ['a zero quantity', { orderedQuantity: 0 }],
    ['a fractional price', { unitPrice: 250.5 }],
    ['a payment without an amount', { payment: { paidOn: '2026-08-20' } }],
    ['a payment without a date', { payment: { amountReceived: 1000 } }],
    ['a zero amount received', { payment: { paidOn: '2026-08-20', amountReceived: 0 } }],
  ])('rejects %s', (_label, override) => {
    expect(createSaleSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateSaleSchema', () => {
  it('leaves out the payment when only the price changes, so a fix never unpays a sale', () => {
    expect(updateSaleSchema.parse({ unitPrice: 260 })).toEqual({ unitPrice: 260 });
  });

  it('takes a payment back with payment: null', () => {
    expect(updateSaleSchema.parse({ payment: null })).toEqual({ payment: null });
  });

  it('rejects an empty body', () => {
    expect(updateSaleSchema.safeParse({}).success).toBe(false);
  });
});
