import type { CSSProperties } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FieldProps {
  label: string;
  input: UseFormRegisterReturn;
  error: FieldError | undefined;
  type?: string;
  inputMode?: 'numeric';
}

const inputStyle: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box' };

/** One labelled input with its own error line: what every short form of the app is made of. */
export function Field({ label, input, error, type = 'text', inputMode }: FieldProps) {
  return (
    <label style={{ display: 'block', marginBottom: '0.75rem' }}>
      {label}
      <input
        type={type}
        inputMode={inputMode}
        aria-invalid={!!error}
        style={inputStyle}
        {...input}
      />
      {error && (
        <span role="alert" style={{ display: 'block', color: 'var(--error)' }}>
          {error.message}
        </span>
      )}
    </label>
  );
}
