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

  // Three argon2 passes, deliberately slow, against every other test file at once: the
  // five-second default cut this off on a loaded machine, which reads as a failure of the
  // hashing rather than of the clock.
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('right-password');
    await expect(verifyPassword(hash, 'right-password')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  }, 20_000);
});

describe('normaliseEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseEmail('  Rakoto@Example.COM ')).toBe('rakoto@example.com');
  });
});
