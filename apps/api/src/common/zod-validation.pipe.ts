import { PipeTransform } from '@nestjs/common';
import type { ValidationIssue } from 'contracts';
import type { ZodType, core } from 'zod';
import { validationError } from './api-error.js';

/** Validates a request body against a zod schema; the handler receives the parsed, typed value. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) throw validationError(result.error.issues.map(toIssue));
    return result.data;
  }
}

/**
 * Zod says what it objected to in English; the front says it in French from `kind`, `origin` and
 * `limit` (reference document, section 10.1). Only what a sentence needs travels: a bound that
 * was crossed, or the type that was expected. Anything else is `other`, and the field simply
 * says the value was refused.
 */
function toIssue(issue: core.$ZodIssue): ValidationIssue {
  const base = { path: issue.path.join('.'), message: issue.message };
  switch (issue.code) {
    case 'too_big':
      return {
        ...base,
        kind: 'too_big',
        origin: issue.origin,
        limit: Number(issue.maximum),
        inclusive: issue.inclusive ?? false,
      };
    case 'too_small':
      return {
        ...base,
        kind: 'too_small',
        origin: issue.origin,
        limit: Number(issue.minimum),
        inclusive: issue.inclusive ?? false,
      };
    case 'invalid_type':
      return { ...base, kind: 'invalid_type', origin: issue.expected };
    case 'invalid_format':
      return { ...base, kind: 'invalid_format' };
    default:
      return { ...base, kind: 'other' };
  }
}
