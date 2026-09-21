import { useEffect, useId, useRef, useState } from 'react';
import type { FieldError } from 'react-hook-form';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  error?: FieldError | undefined;
  disabled?: boolean;
}

/**
 * A dropdown positioned by our own CSS, not the browser: a native <select>'s popup opens at the
 * real window's coordinates, which breaks under devtools device emulation (and some in-app
 * webviews) — the list opens off in a corner instead of under the field. This keeps the same
 * one-tap, label-wrapped shape as every other field.
 */
export function Select({ label, value, onChange, options, error, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );
    optionRefs.current[selectedIndex]?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const moveFocus = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    optionRefs.current[next]?.focus();
  };

  return (
    <label>
      {label}
      <div className="select" ref={rootRef}>
        <button
          type="button"
          className="select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          disabled={disabled}
          onClick={() => setOpen((was) => !was)}
        >
          <span>{selected?.label ?? ''}</span>
          <span className="select-caret" aria-hidden="true" />
        </button>
        {open && (
          <ul role="listbox" id={listId} className="select-list" aria-label={label}>
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                onClick={() => choose(option.value)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveFocus(index, 1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveFocus(index, -1);
                  } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose(option.value);
                  }
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span role="alert">{error.message}</span>}
    </label>
  );
}
