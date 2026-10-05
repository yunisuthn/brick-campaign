import type { ChangeEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

/** "50000" -> "50 000": grouped by 3 from the right, for on-screen display only. */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * The inverse of the grouping below: a numeric field holds "50 000", strip it back to "50000"
 * before validating or calling `Number(...)`. react-hook-form can hand a `setValueAs` its default
 * value unchanged (a number, not yet typed into the field), so this also accepts that.
 */
export function digitsOnly(value: string | number): string {
  return String(value).replace(/\s/g, '');
}

/**
 * As the person types, non-digits are dropped and the rest is grouped by 3, with the caret kept
 * at the same digit rather than jumping to the end. The stored value is that spaced string, not
 * a plain digit string: read it through `digitsOnly` before any `Number(...)`.
 */
export function handleNumericChange(
  event: ChangeEvent<HTMLInputElement>,
  onChange: UseFormRegisterReturn['onChange'],
) {
  const target = event.target;
  const caret = target.selectionStart ?? target.value.length;
  const digitsBeforeCaret = target.value.slice(0, caret).replace(/\D/g, '').length;
  const digits = target.value.replace(/\D/g, '');
  const formatted = groupDigits(digits);

  // A single synchronous mutation before handing off to react-hook-form: it reads the ref's
  // value at various points (validation, submit, watch), some of them after this handler
  // returns, so the field's stored value is the spaced string itself, not a digits-only copy
  // kept in sync separately — that would drift given RHF's own read timing.
  target.value = formatted;
  let seen = 0;
  let pos = formatted.length;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]!)) seen++;
    if (seen === digitsBeforeCaret) {
      pos = i + 1;
      break;
    }
  }
  target.setSelectionRange(pos, pos);
  void onChange(event);
}
