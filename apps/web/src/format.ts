/** Amounts are ariary, whole numbers: `1 250 000 Ar` (French grouping, narrow no-break spaces). */
const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatAmount(value: number): string {
  return `${amount.format(value)} Ar`;
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
