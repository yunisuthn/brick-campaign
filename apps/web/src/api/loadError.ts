import { ApiError } from './client.js';

/** A wrong or stale id is a plain "not found", said in the words of the screen; anything else is an API failure. */
export function loadErrorMessage(error: Error, notFound: string): string {
  if (error instanceof ApiError && error.status === 404) return notFound;
  return `Chargement impossible : ${error.message}`;
}
