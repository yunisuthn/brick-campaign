import { validateEnv } from './env.schema.js';

const required = {
  DATABASE_URL: 'postgresql://u:p@localhost:5433/db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('rejects an empty environment and names every missing variable', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET/);
  });

  it('applies defaults when only the required variables are provided', () => {
    expect(validateEnv(required)).toEqual({ ...required, NODE_ENV: 'development', PORT: 3000 });
  });

  it('coerces PORT to a number', () => {
    expect(validateEnv({ ...required, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() => validateEnv({ ...required, DATABASE_URL: 'mysql://u:p@localhost/db' })).toThrow(
      /postgresql/,
    );
  });

  it('rejects a short JWT_SECRET', () => {
    expect(() => validateEnv({ ...required, JWT_SECRET: 'too-short' })).toThrow(/JWT_SECRET/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...required, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
