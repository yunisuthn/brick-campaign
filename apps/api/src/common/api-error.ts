import { HttpException } from '@nestjs/common';
import {
  type ApiErrorBody,
  type ErrorCode,
  type ErrorDetails,
  type ValidationIssue,
  errorStatuses,
} from 'contracts';

/**
 * Every refusal the API sends carries a code the front translates (reference document, section
 * 10.1). The English `message` travels along for the logs and for the tests, which assert the
 * code and never the phrase. The code and its status live in `contracts`, read by both sides.
 */
export function apiError(code: ErrorCode, message: string, details?: ErrorDetails): HttpException {
  const body: ApiErrorBody = details === undefined ? { code, message } : { code, message, details };
  return new HttpException(body, errorStatuses[code]);
}

/** The shape rejected by a DTO schema: one issue per field, so the front can place each one. */
export function validationError(issues: ValidationIssue[]): HttpException {
  const body: ApiErrorBody = { code: 'validation_failed', message: 'Validation failed', issues };
  return new HttpException(body, errorStatuses.validation_failed);
}

export type { ErrorCode, ErrorDetails, ValidationIssue };
