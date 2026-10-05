/** Amounts are ariary, whole numbers: `1 250 000 Ar` (French grouping, narrow no-break spaces). */
const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatAmount(value: number): string {
  return `${amount.format(value)} Ar`;
}

/** The interface's two languages (i18n/I18nProvider.tsx), for the figures that read differently. */
export type FormatLang = 'fr' | 'mg';

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/*
 * Malagasy month names, written out rather than asked of Intl: not every browser carries the
 * Malagasy locale, and one that lacks it would fall back to English (reference document,
 * section 10.12).
 */
const MG_MONTHS = [
  'Janoary',
  'Febroary',
  'Martsa',
  'Aprily',
  'Mey',
  'Jona',
  'Jolay',
  'Aogositra',
  'Septambra',
  'Oktobra',
  'Novambra',
  'Desambra',
] as const;

/**
 * The API sends calendar days as `YYYY-MM-DD`. Handing that string to `Date` would read it as
 * midnight UTC and shift the day in some zones, so the parts are read and the date built locally.
 */
export function formatDate(value: string, lang: FormatLang = 'fr'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Not a calendar date: ${value}`);
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  if (lang === 'mg') return `${day} ${MG_MONTHS[month - 1]} ${year}`;
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
export function formatBricks(quantity: number, lang: FormatLang = 'fr'): string {
  if (lang === 'mg') return `${formatCount(quantity)} biriky`;
  return `${formatCount(quantity)} ${quantity === 1 ? 'brique' : 'briques'}`;
}
