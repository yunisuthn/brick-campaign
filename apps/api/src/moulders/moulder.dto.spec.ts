import {
  createMoulderSchema,
  listMouldersQuerySchema,
  updateMoulderSchema,
} from './moulder.dto.js';

describe('createMoulderSchema', () => {
  it('trims the name and defaults to a single member', () => {
    expect(createMoulderSchema.parse({ name: '  Rakoto ' })).toEqual({
      name: 'Rakoto',
      memberCount: 1,
    });
  });

  it.each([
    ['a blank name', { name: '   ' }],
    ['zero members', { name: 'Rakoto', memberCount: 0 }],
    ['a fractional member count', { name: 'Rakoto', memberCount: 1.5 }],
  ])('rejects %s', (_label, body) => {
    expect(createMoulderSchema.safeParse(body).success).toBe(false);
  });
});

describe('createMoulderSchema: active flag', () => {
  it('is ignored at creation, a new moulder is always active', () => {
    expect(createMoulderSchema.parse({ name: 'Rakoto', active: false })).toEqual({
      name: 'Rakoto',
      memberCount: 1,
    });
  });
});

describe('updateMoulderSchema', () => {
  it('accepts retiring a moulder on its own', () => {
    expect(updateMoulderSchema.parse({ active: false })).toEqual({ active: false });
  });

  it('rejects an empty body', () => {
    expect(updateMoulderSchema.safeParse({}).success).toBe(false);
  });
});

describe('listMouldersQuerySchema', () => {
  it('defaults to active only and reads the flag from a query string', () => {
    expect(listMouldersQuerySchema.parse({})).toEqual({ includeInactive: false });
    expect(listMouldersQuerySchema.parse({ includeInactive: 'true' })).toEqual({
      includeInactive: true,
    });
  });

  it('rejects a value that is not a boolean word', () => {
    expect(listMouldersQuerySchema.safeParse({ includeInactive: 'maybe' }).success).toBe(false);
  });
});
