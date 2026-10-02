import type { ChangeEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

/** "50000" -> "50 000": grouped by 3 from the right, for on-screen display only. */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * As the person types, non-digits are dropped and the stored value stays a plain digit string
 * (what validation and `Number(...)` downstream expect); only the input's own display gets the
 * grouping spaces, with the caret kept at the same digit rather than jumping to the end.
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
