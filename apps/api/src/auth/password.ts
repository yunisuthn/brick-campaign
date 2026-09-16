import argon2 from 'argon2';

/** Enforced wherever a password is set (seed script, future password change), never at login. */
export const PASSWORD_MIN_LENGTH = 12;

/** argon2id with the library defaults (OWASP-recommended); the parameters are embedded in the hash. */
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

/** Emails are compared case-insensitively; normalise once so the unique index does the work. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
