import { validateEnv } from './env.schema.js';

describe('validateEnv', () => {
  it('rejects an empty environment and names the missing variable', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('applies defaults when only DATABASE_URL is provided', () => {
    expect(validateEnv({ DATABASE_URL: 'postgresql://u:p@localhost:5433/db' })).toEqual({
      DATABASE_URL: 'postgresql://u:p@localhost:5433/db',
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('coerces PORT to a number', () => {
    const env = validateEnv({ DATABASE_URL: 'postgresql://u:p@localhost/db', PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() => validateEnv({ DATABASE_URL: 'mysql://u:p@localhost/db' })).toThrow(/postgresql/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: 'postgresql://u:p@localhost/db', NODE_ENV: 'staging' }),
    ).toThrow(/NODE_ENV/);
  });
});
