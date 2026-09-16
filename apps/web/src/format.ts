/** Amounts are ariary, whole numbers: `1 250 000 Ar` (French grouping, narrow no-break spaces). */
const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatAmount(value: number): string {
  return `${amount.format(value)} Ar`;
}

/**
 * A numeric Field displays grouping spaces as typed; strip them back to a plain digit string.
 * react-hook-form can hand a `setValueAs` its default value unchanged (a number, not yet typed
 * into the field), so this also accepts that.
 */
export function digitsOnly(value: string | number): string {
  return String(value).replace(/\s/g, '');
}

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * The API sends calendar days as `YYYY-MM-DD`. Handing that string to `Date` would read it as
 * midnight UTC and shift the day in some zones, so the parts are read and the date built locally.
 */
export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Not a calendar date: ${value}`);
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  return date.format(new Date(year, month - 1, day));
}

/** Today as the API's `YYYY-MM-DD`, in the local calendar: the day the person sees on their phone. */
export function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const count = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** Whole counts, French grouping: `39 999`. */
export function formatCount(value: number): string {
  return count.format(value);
}

/** Bricks are counted, never fractional: `1 200 briques`. */
export function formatBricks(quantity: number): string {
  return `${formatCount(quantity)} ${quantity === 1 ? 'brique' : 'briques'}`;
}
