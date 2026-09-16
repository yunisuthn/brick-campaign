import { createPaymentSchema, updatePaymentSchema } from './payment.dto.js';

const moulderId = '01920000-0000-7000-8000-000000000001';
const base = { date: '2026-06-10', type: 'vatsy', amount: 20000 };

describe('createPaymentSchema', () => {
  it('accepts a moulder or a trimmed contractor name as beneficiary', () => {
    expect(createPaymentSchema.parse({ ...base, moulderId })).toEqual({ ...base, moulderId });
    expect(createPaymentSchema.parse({ ...base, contractorName: ' Rasoa ' })).toEqual({
      ...base,
      contractorName: 'Rasoa',
    });
  });

  it.each([
    ['no beneficiary', {}],
    ['both beneficiaries', { moulderId, contractorName: 'Rasoa' }],
    ['a blank contractor name', { contractorName: '  ' }],
    ['an unknown type', { moulderId, type: 'bonus' }],
    ['a zero amount', { moulderId, amount: 0 }],
  ])('rejects %s', (_label, override) => {
    expect(createPaymentSchema.safeParse({ ...base, ...override }).success).toBe(false);
  });
});

describe('updatePaymentSchema', () => {
  it('accepts a single beneficiary change', () => {
    expect(updatePaymentSchema.parse({ contractorName: 'Rasoa' })).toEqual({
      contractorName: 'Rasoa',
    });
  });

  it('rejects an empty body and both beneficiaries at once', () => {
    expect(updatePaymentSchema.safeParse({}).success).toBe(false);
    expect(updatePaymentSchema.safeParse({ moulderId, contractorName: 'Rasoa' }).success).toBe(
      false,
    );
  });
});
