import { ApiError } from './client.js';
import { apiErrorMessage } from './errorMessages.js';

/**
 * An id that names nothing — unknown, cancelled, or malformed in the address bar — is a plain
 * "not found", said in the words of the screen. Anything else is an API failure, translated,
 * behind the prefix in the interface's language.
 */
export function loadErrorMessage(
  error: Error,
  notFound: string,
  t: (key: 'common.loadFailedPrefix') => string,
): string {
  const missing =
    error instanceof ApiError && (error.status === 404 || error.code === 'validation_failed');
  return missing ? notFound : `${t('common.loadFailedPrefix')} ${apiErrorMessage(error)}`;
}
