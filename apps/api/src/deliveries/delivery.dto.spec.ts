import { createDeliverySchema, updateDeliverySchema } from './delivery.dto.js';

const valid = { date: '2026-08-05', quantity: 2500, cost: 60000 };

describe('createDeliverySchema', () => {
  it('defaults the plate to null', () => {
    expect(createDeliverySchema.parse(valid)).toEqual({ ...valid, plate: null });
  });

  it('accepts a zero cost', () => {
    expect(createDeliverySchema.parse({ ...valid, cost: 0 }).cost).toBe(0);
  });

  it.each([
    ['a zero quantity', { quantity: 0 }],
    ['a negative cost', { cost: -1 }],
    ['a fractional cost', { cost: 100.5 }],
    ['a blank plate', { plate: ' ' }],
  ])('rejects %s', (_label, override) => {
    expect(createDeliverySchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateDeliverySchema', () => {
  it('leaves out the fields not sent', () => {
    expect(updateDeliverySchema.parse({ cost: 65000 })).toEqual({ cost: 65000 });
  });

  it('rejects an empty body', () => {
    expect(updateDeliverySchema.safeParse({}).success).toBe(false);
  });
});
