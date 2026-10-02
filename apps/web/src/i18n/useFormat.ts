import { useMemo } from 'react';
import { formatAmount, formatBricks, formatCount, formatDate, today } from '../format.js';
import { useTranslation } from './I18nProvider.js';

/** The calendar day before `iso`, in the same `YYYY-MM-DD` form. */
function dayBefore(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  const previous = new Date(year, month - 1, day - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${previous.getFullYear()}-${pad(previous.getMonth() + 1)}-${pad(previous.getDate())}`;
}

/**
 * The figures of format.ts in the interface's language (reference document, section 10.12):
 * a quantity reads "1 800 biriky" and a date "2 Oktobra 2026" in Malagasy. Amounts and plain
 * counts read the same in both.
 */
export function useFormat() {
  const { lang, t } = useTranslation();
  return useMemo(
    () => ({
      amount: formatAmount,
      count: formatCount,
      bricks: (quantity: number) => formatBricks(quantity, lang),
      date: (iso: string) => formatDate(iso, lang),
      /** A day heading a group of entries: today and yesterday are named, the others dated. */
      day: (iso: string) => {
        const now = today();
        if (iso === now) return `${t('common.today')} · ${formatDate(iso, lang)}`;
        if (iso === dayBefore(now)) return `${t('common.yesterday')} · ${formatDate(iso, lang)}`;
        return formatDate(iso, lang);
      },
    }),
    [lang, t],
  );
}
