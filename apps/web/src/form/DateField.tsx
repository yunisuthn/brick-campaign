import { useId, useState } from 'react';
import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { frenchToIso, isoToFrench, maskFrenchDateDigits } from './dateMask.js';

interface DateFieldProps<T extends FieldValues> {
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
  error: FieldError | undefined;
  /** Message shown when left empty; omitted, the date is optional. */
  required?: string;
}

/**
 * A date typed and shown as jj/mm/aaaa, everywhere and regardless of the browser's own locale
 * (a native `<input type="date">` otherwise follows it, which reads mm/dd/yyyy for plenty of
 * people). The form still carries the API's ISO string underneath — see dateMask.ts — so every
 * caller downstream (submission, `form.reset`, defaultValues) keeps working on `YYYY-MM-DD`
 * untouched; only this field's own display is in French.
 */
export function DateField<T extends FieldValues>({
  label,
  name,
  control,
  error,
  required,
}: DateFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={required === undefined ? {} : { required }}
      render={({ field }) => (
        <DateBox
          label={label}
          error={error}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
        />
      )}
    />
  );
}

export interface DateBoxProps {
  label: string;
  error?: FieldError | undefined;
  value: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

/**
 * The masked text input itself, reusable outside a form (a plain "from/to" filter has no
 * react-hook-form field to control). While the box has focus, what is shown is a local draft —
 * so a half-typed date does not collapse to empty on every keystroke — which settles back to
 * the parsed date, or to empty, only on blur.
 */
export function DateBox({ label, error, value, onChange, onBlur, inputRef }: DateBoxProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? isoToFrench(value);

  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder="jj/mm/aaaa"
        aria-invalid={!!error}
        value={shown}
        onFocus={() => setDraft(isoToFrench(value))}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
          const masked = maskFrenchDateDigits(digits);
          setDraft(masked);
          onChange(frenchToIso(masked));
        }}
        onBlur={() => {
          setDraft(null);
          onBlur?.();
        }}
      />
      {error && <span role="alert">{error.message}</span>}
    </label>
  );
}
