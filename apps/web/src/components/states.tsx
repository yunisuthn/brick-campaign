import { CalendarDays, CircleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';
import { IconTile } from './marks.js';

/** Nothing to show yet: an icon, one line, and what to do about it. */
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-8 text-center shadow-sm">
      <IconTile icon={icon} />
      <p className="font-semibold">{title}</p>
      {children}
    </section>
  );
}

/** No campaign to work in yet: the way to create the first, then what it is needed for. */
export function NoCampaign({ suffix }: { suffix: TranslationKey }) {
  const { t } = useTranslation();
  return (
    <EmptyState icon={CalendarDays} title={t('common.noCampaignShort')}>
      <p className="text-sm text-muted-foreground">
        {t('common.noCampaignPrefix')}{' '}
        <Link
          to="/campagnes/nouvelle"
          className="font-medium text-primary underline underline-offset-4"
        >
          {t('common.noCampaignLinkText')}
        </Link>
        {t(suffix)}
      </p>
    </EmptyState>
  );
}

/** Grey rows where a list will be, the word for screen readers. */
export function LoadingList({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div>
      <p role="status" className="sr-only">
        {t('common.loading')}
      </p>
      <div aria-hidden="true" className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 border-t px-4 py-3.5 first:border-t-0"
          >
            <div className="flex grow flex-col gap-2">
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A request that failed, in a red box: the prefix says what failed, the message why. */
export function ErrorNote({ prefix, message }: { prefix?: string; message: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.07] px-4 py-3.5 text-destructive"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>
        {prefix && <span className="font-semibold">{prefix} </span>}
        <span className="text-foreground">{message}</span>
      </p>
    </div>
  );
}
