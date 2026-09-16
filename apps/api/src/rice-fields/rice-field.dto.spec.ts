import { createRiceFieldSchema, updateRiceFieldSchema } from './rice-field.dto.js';

const valid = { name: 'Ambohitsoa', location: 'Ambohidratrimo', contractType: 'durable' };

describe('createRiceFieldSchema', () => {
  it('defaults the surface to null', () => {
    expect(createRiceFieldSchema.parse(valid)).toEqual({ ...valid, surfaceM2: null });
  });

  it.each([
    ['a blank location', { location: ' ' }],
    ['an unknown contract type', { contractType: 'monthly' }],
    ['a zero surface', { surfaceM2: 0 }],
    ['a fractional surface', { surfaceM2: 12.5 }],
  ])('rejects %s', (_label, override) => {
    expect(createRiceFieldSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateRiceFieldSchema', () => {
  it('leaves out the surface when only the contract changes', () => {
    expect(updateRiceFieldSchema.parse({ contractType: 'seasonal' })).toEqual({
      contractType: 'seasonal',
    });
  });

  it('rejects an empty body', () => {
    expect(updateRiceFieldSchema.safeParse({}).success).toBe(false);
  });
});
