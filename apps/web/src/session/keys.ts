/** Cache key of the current session: a user, or `null` when nobody is signed in. */
export const SESSION_KEY = ['session'] as const;

export interface SessionUser {
  id: string;
  email: string;
}
