import { hashPassword, normaliseEmail, verifyPassword } from './password.js';

describe('hashPassword / verifyPassword', () => {
  it('produces an argon2id hash that does not contain the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('correct horse');
  });

  it('salts every hash so the same password never hashes twice to the same value', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same-password'),
      hashPassword('same-password'),
    ]);
    expect(a).not.toBe(b);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('right-password');
    await expect(verifyPassword(hash, 'right-password')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });
});

describe('normaliseEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseEmail('  Rakoto@Example.COM ')).toBe('rakoto@example.com');
  });
});
