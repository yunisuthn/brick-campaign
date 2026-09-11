import { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { validationError } from './api-error.js';

/** Validates a request body against a zod schema; the handler receives the parsed, typed value. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw validationError(
        result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      );
    }
    return result.data;
  }
}
