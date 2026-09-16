import type { CookieOptions, Request } from 'express';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/** What the API knows about the caller once the cookie is verified. */
export interface SessionUser {
  id: string;
  email: string;
}

/** JWT claims: `sub` is the user id; `email` is denormalised so /auth/me needs no query. */
export interface SessionClaims {
  sub: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

/** Same options for set and clear: a cookie is only cleared when path and flags match. */
export function sessionCookieOptions(nodeEnv: string): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: nodeEnv === 'production',
    path: '/',
  };
}
