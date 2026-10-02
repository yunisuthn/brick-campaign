import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { useId, useState, type ReactNode } from 'react';
import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { frenchToIso, isoToFrench, maskFrenchDateDigits } from '../form/dateMask.js';
import { handleNumericChange } from '../form/Field.js';

/*
 * The fields of the redesigned screens (reference document, section 10.12): a label above its
 * control, then a hint or the error in its place, tied to the control by aria-describedby.
 * Text and numbers are registered; dates, lists and short choices go through a Controller,
 * since the value the form holds is not the text on screen.
 */

interface FormFieldProps {
  label: string;
  hint?: string;
  error: FieldError | undefined;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function FormField({ label, hint, error, className, children }: FormFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error?.message ?? hint;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="leading-snug">
        {label}
      </Label>
      {children(id, note ? noteId : undefined)}
      {error ? (
        <p id={noteId} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        hint && (
          <p id={noteId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  hint?: string;
  error: FieldError | undefined;
  registration: UseFormRegisterReturn;
  type?: 'text' | 'email' | 'password' | 'tel';
  autoComplete?: string;
  /** Offered as a datalist: the value stays free text, the known ones are one tap away. */
  suggestions?: ReadonlyArray<string>;
  className?: string;
}

export function TextField({
  label,
  hint,
  error,
  registration,
  type = 'text',
  autoComplete,
  suggestions,
  className,
}: TextFieldProps) {
  const listId = useId();
  const withList = suggestions !== undefined && suggestions.length > 0;
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => (
        <>
          <Input
            id={id}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            list={withList ? listId : undefined}
            {...registration}
          />
          {withList && (
            <datalist id={listId}>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          )}
        </>
      )}
    </FormField>
  );
}

interface NumberFieldProps {
  label: string;
  hint?: string;
  error: FieldError | undefined;
  registration: UseFormRegisterReturn;
  className?: string;
}

/** Digits only, grouped by three as they are typed (form/Field.tsx does the same). */
export function NumberField({ label, hint, error, registration, className }: NumberFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => (
        <NumberInput
          id={id}
          describedBy={describedBy}
          invalid={!!error}
          registration={registration}
        />
      )}
    </FormField>
  );
}

export function NumberInput({
  id,
  describedBy,
  invalid,
  registration,
  className,
}: {
  id?: string;
  describedBy?: string | undefined;
  invalid: boolean;
  registration: UseFormRegisterReturn;
  className?: string;
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={cn('text-right tabular-nums', className)}
      {...registration}
      onChange={(event) => handleNumericChange(event, registration.onChange)}
    />
  );
}

interface ControlledProps<T extends FieldValues> {
  label: string;
  hint?: string;
  name: FieldPath<T>;
  control: Control<T>;
  error: FieldError | undefined;
  rules?: RegisterOptions<T, FieldPath<T>>;
  className?: string;
}

/** A date typed as jj/mm/aaaa, the form holding the API's ISO string underneath. */
export function DateField<T extends FieldValues>({
  label,
  hint,
  name,
  control,
  error,
  required,
  className,
}: Omit<ControlledProps<T>, 'rules'> & {
  /** Message shown when left empty; omitted, the date is optional. */
  required?: string;
}) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => (
        <Controller
          name={name}
          control={control}
          rules={required === undefined ? {} : { required }}
          render={({ field }) => (
            <DateInput
              id={id}
              describedBy={describedBy}
              invalid={!!error}
              value={(field.value as string | undefined) ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
            />
          )}
        />
      )}
    </FormField>
  );
}

/**
 * The masking of form/DateField.tsx on the new input: while the box has focus a local draft is
 * shown, so a half-typed date does not collapse to empty on every keystroke.
 */
export function DateInput({
  id,
  describedBy,
  invalid,
  value,
  onChange,
  onBlur,
  inputRef,
}: {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  value: string;
  onChange: (iso: string) => void;
  onBlur: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      id={id}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      placeholder="jj/mm/aaaa"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      value={draft ?? isoToFrench(value)}
      onFocus={() => setDraft(isoToFrench(value))}
      onChange={(event) => {
        const masked = maskFrenchDateDigits(event.target.value.replace(/\D/g, '').slice(0, 8));
        setDraft(masked);
        onChange(frenchToIso(masked));
      }}
      onBlur={() => {
        setDraft(null);
        onBlur();
      }}
    />
  );
}

export interface Option {
  value: string;
  label: string;
}

/*
 * Radix refuses an item whose value is the empty string, which the forms use for "nothing
 * chosen" ("À fixer", "Aucun"). Such an option travels under this stand-in instead and is
 * mapped back before the form sees it.
 */
const EMPTY = '__empty__';
const toItem = (value: string) => (value === '' ? EMPTY : value);
const fromItem = (value: string) => (value === EMPTY ? '' : value);

/**
 * A closed list. With a `placeholder`, an empty value shows it and no option stands for
 * "nothing"; without one, an option whose value is '' is an ordinary choice.
 */
export function SelectField<T extends FieldValues>({
  label,
  hint,
  name,
  control,
  error,
  rules,
  options,
  placeholder,
  className,
}: ControlledProps<T> & { options: ReadonlyArray<Option>; placeholder?: string }) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => (
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => (
            <SelectInput
              id={id}
              describedBy={describedBy}
              invalid={!!error}
              value={(field.value as string | undefined) ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              triggerRef={field.ref}
              options={options}
              placeholder={placeholder}
            />
          )}
        />
      )}
    </FormField>
  );
}

/** The list itself, for a filter outside any form as much as for SelectField. */
export function SelectInput({
  id,
  describedBy,
  invalid = false,
  value,
  onChange,
  onBlur,
  triggerRef,
  options,
  placeholder,
}: {
  id: string;
  describedBy?: string | undefined;
  invalid?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  triggerRef?: (el: HTMLButtonElement | null) => void;
  options: ReadonlyArray<Option>;
  placeholder?: string;
}) {
  return (
    <Select
      value={value === '' && placeholder !== undefined ? '' : toItem(value)}
      onValueChange={(next) => onChange(fromItem(next))}
    >
      <SelectTrigger
        id={id}
        ref={triggerRef}
        onBlur={onBlur}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={toItem(option.value)} className="min-h-11">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Two to four values side by side, one tap each (reference document, section 10.12): radio
 * buttons drawn as a segmented control, the arrow keys moving between them.
 */
export function ChoiceField<T extends FieldValues>({
  label,
  hint,
  name,
  control,
  error,
  rules,
  options,
  className,
}: ControlledProps<T> & { options: ReadonlyArray<Option> }) {
  const labelId = useId();
  const noteId = `${labelId}-note`;
  const note = error?.message ?? hint;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span id={labelId} className="text-sm leading-snug font-medium">
        {label}
      </span>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <RadioGroupPrimitive.Root
            ref={field.ref}
            value={(field.value as string | undefined) ?? ''}
            onValueChange={field.onChange}
            aria-labelledby={labelId}
            aria-describedby={note ? noteId : undefined}
            aria-invalid={!!error}
            className="grid gap-1.5 rounded-[10px] bg-muted p-1"
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
          >
            {options.map((option) => (
              <RadioGroupPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-[7px] px-2 text-center text-sm leading-tight font-medium text-muted-foreground transition-colors outline-none',
                  'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  'data-[state=checked]:bg-card data-[state=checked]:font-semibold data-[state=checked]:text-primary data-[state=checked]:shadow-sm',
                )}
              >
                {option.label}
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
        )}
      />
      {error ? (
        <p id={noteId} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        hint && (
          <p id={noteId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
