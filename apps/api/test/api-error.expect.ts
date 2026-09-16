import { HttpException } from '@nestjs/common';
import type { ErrorCode, ErrorDetails } from '../src/common/api-error.js';

/**
 * Asserts a refusal by its code, and by the numbers the front needs to build its sentence.
 * The code is the contract (reference document, section 10.1); the English message is free to
 * change without a test noticing, which is the point of having a code at all.
 */
export async function rejectsWithCode(
  call: Promise<unknown>,
  code: ErrorCode,
  details?: ErrorDetails,
): Promise<void> {
  const thrown: unknown = await call.then(
    () => {
      throw new Error(`Expected the call to be refused with ${code}, it resolved`);
    },
    (error: unknown) => error,
  );
  expectCode(thrown, code, details);
}

/** Same check for the handful of rules that are plain synchronous functions. */
export function throwsWithCode(call: () => unknown, code: ErrorCode, details?: ErrorDetails): void {
  try {
    call();
  } catch (error: unknown) {
    expectCode(error, code, details);
    return;
  }
  throw new Error(`Expected the call to be refused with ${code}, it returned`);
}

function expectCode(thrown: unknown, code: ErrorCode, details?: ErrorDetails): void {
  expect(thrown).toBeInstanceOf(HttpException);
  const body = (thrown as HttpException).getResponse();
  expect(body).toMatchObject(details === undefined ? { code } : { code, details });
}
