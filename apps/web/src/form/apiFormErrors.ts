import type { ValidationIssue } from 'contracts';
import type { FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';
import { ApiError } from '../api/client.js';
import { apiErrorMessage } from '../api/errorMessages.js';
import { formatCount } from '../format.js';

export interface ApiFormErrors<T extends FieldValues> {
  /** Merged into the form's own errors, so a refused value shows under its field. */
  fields: FieldErrors<T>;
  /** What no field can say. Null when the fields carry the whole answer. */
  message: string | null;
}

/**
 * Reads a refused saisie the way the form is laid out: every issue the API named lands on its
 * field, and only what is left over is said above the form (reference document, section 10.1).
 * Derived at render, so a new attempt clears it without anything to reset.
 */
export function apiFormErrors<T extends FieldValues>(
  mutation: { error: Error | null },
  form: UseFormReturn<T>,
): ApiFormErrors<T> {
  const { error } = mutation;
  if (error === null) return { fields: {}, message: null };
  if (!(error instanceof ApiError) || error.issues === undefined) {
    return { fields: {}, message: apiErrorMessage(error) };
  }

  const known = new Set(Object.keys(form.getValues()));
  const fields: Record<string, { type: string; message: string }> = {};
  let leftOver = false;
  for (const issue of error.issues) {
    if (!known.has(issue.path)) {
      leftOver = true;
      continue;
    }
    fields[issue.path] ??= { type: 'api', message: fieldSentence(issue) };
  }
  return {
    fields: fields as FieldErrors<T>,
    message: leftOver || Object.keys(fields).length === 0 ? apiErrorMessage(error) : null,
  };
}

/** The refusal in the words of the interface, short enough to sit under an input. */
function fieldSentence(issue: ValidationIssue): string {
  const { limit, origin } = issue;
  switch (issue.kind) {
    case 'too_big':
      if (limit === undefined) return 'Cette valeur est trop grande.';
      if (origin === 'string') return `${formatCount(limit)} caractères au maximum.`;
      return issue.inclusive
        ? `${formatCount(limit)} au maximum.`
        : `Moins de ${formatCount(limit)}.`;
    case 'too_small':
      if (limit === undefined) return 'Cette valeur est trop petite.';
      if (origin === 'string') {
        return limit <= 1 ? 'Ce champ est requis.' : `${formatCount(limit)} caractères au minimum.`;
      }
      if (issue.inclusive) return `Au moins ${formatCount(limit)}.`;
      return origin === 'int'
        ? `Au moins ${formatCount(limit + 1)}.`
        : `Plus de ${formatCount(limit)}.`;
    case 'invalid_type':
      if (origin === 'int') return 'Un nombre entier est attendu.';
      if (origin === 'number') return 'Un nombre est attendu.';
      if (origin === 'string') return 'Du texte est attendu.';
      return 'Cette valeur n’a pas le type attendu.';
    case 'invalid_format':
      return 'Le format attendu n’est pas respecté.';
    default:
      return 'Cette valeur a été refusée.';
  }
}
