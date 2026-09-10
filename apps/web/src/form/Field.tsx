import { type CSSProperties, useId } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FieldProps {
  label: string;
  input: UseFormRegisterReturn;
  error: FieldError | undefined;
  type?: string;
  inputMode?: 'numeric' | 'tel';
  /** Offered as a datalist: the value stays free text, the known ones are one tap away. */
  suggestions?: ReadonlyArray<string>;
}

const controlStyle: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box' };
const labelStyle: CSSProperties = { display: 'block', marginBottom: '0.75rem' };

function ErrorLine({ error }: { error: FieldError | undefined }) {
  if (!error) return null;
  return (
    <span role="alert" style={{ display: 'block', color: 'var(--error)' }}>
      {error.message}
    </span>
  );
}

/** One labelled input with its own error line: what every short form of the app is made of. */
export function Field({ label, input, error, type = 'text', inputMode, suggestions }: FieldProps) {
  const listId = useId();
  return (
    <label style={labelStyle}>
      {label}
      <input
        type={type}
        inputMode={inputMode}
        aria-invalid={!!error}
        list={suggestions && suggestions.length > 0 ? listId : undefined}
        style={controlStyle}
        {...input}
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

interface SelectFieldProps {
  label: string;
  input: UseFormRegisterReturn;
  error: FieldError | undefined;
  options: ReadonlyArray<{ value: string; label: string }>;
}

/** Same as Field, for a closed list of values. */
export function SelectField({ label, input, error, options }: SelectFieldProps) {
  return (
    <label style={labelStyle}>
      {label}
      <select aria-invalid={!!error} style={controlStyle} {...input}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorLine error={error} />
    </label>
  );
}
