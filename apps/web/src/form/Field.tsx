import { useId, type ChangeEvent } from 'react';
import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { Select, type SelectOption } from './Select.js';

interface FieldProps {
  label: string;
  input: UseFormRegisterReturn;
  error: FieldError | undefined;
  type?: string;
  inputMode?: 'numeric' | 'tel';
  /** Offered as a datalist: the value stays free text, the known ones are one tap away. */
  suggestions?: ReadonlyArray<string>;
}

function ErrorLine({ error }: { error: FieldError | undefined }) {
  if (!error) return null;
  return <span role="alert">{error.message}</span>;
}

/** "50000" -> "50 000": grouped by 3 from the right, for on-screen display only. */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * As the person types, non-digits are dropped and the stored value stays a plain digit string
 * (what validation and `Number(...)` downstream expect); only the input's own display gets the
 * grouping spaces, with the caret kept at the same digit rather than jumping to the end.
 */
function handleNumericChange(
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

/** One labelled input with its own error line: what every short form of the app is made of. */
export function Field({ label, input, error, type = 'text', inputMode, suggestions }: FieldProps) {
  const listId = useId();
  const numeric = inputMode === 'numeric';
  return (
    <label>
      {label}
      <input
        type={type}
        inputMode={inputMode}
        aria-invalid={!!error}
        list={suggestions && suggestions.length > 0 ? listId : undefined}
        {...input}
        onChange={numeric ? (event) => handleNumericChange(event, input.onChange) : input.onChange}
      />
      {suggestions && suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
      <ErrorLine error={error} />
    </label>
  );
}

interface SelectFieldProps<T extends FieldValues> {
  label: string;
  name: FieldPath<T>;
  control: Control<T>;
  error: FieldError | undefined;
  options: ReadonlyArray<SelectOption>;
  rules?: RegisterOptions<T, FieldPath<T>>;
}

/** Same as Field, for a closed list of values; the dropdown itself is our own, not the
 * browser's — see Select.tsx for why. */
export function SelectField<T extends FieldValues>({
  label,
  name,
  control,
  error,
  options,
  rules,
}: SelectFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <Select
          label={label}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          options={options}
          error={error}
        />
      )}
    />
  );
}
