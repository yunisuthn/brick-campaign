import { createClientSchema, updateClientSchema } from './client.dto.js';

const valid = { name: 'Rakoto', locality: 'Ambohidratrimo' };

describe('createClientSchema', () => {
  it('defaults the phone to null', () => {
    expect(createClientSchema.parse(valid)).toEqual({ ...valid, phone: null });
  });

  it('trims the phone', () => {
    expect(createClientSchema.parse({ ...valid, phone: ' 034 12 345 67 ' }).phone).toBe(
      '034 12 345 67',
    );
  });

  it.each([
    ['a blank name', { name: ' ' }],
    ['a blank locality', { locality: '' }],
    ['a blank phone', { phone: ' ' }],
  ])('rejects %s', (_label, override) => {
    expect(createClientSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('updateClientSchema', () => {
  it('leaves out the fields not sent', () => {
    expect(updateClientSchema.parse({ phone: null })).toEqual({ phone: null });
  });

  it('rejects an empty body', () => {
    expect(updateClientSchema.safeParse({}).success).toBe(false);
  });
});
