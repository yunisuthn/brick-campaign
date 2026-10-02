import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

interface ListCardProps {
  /** A band above the rows: a day and its total, say (see GroupHeader). */
  header?: ReactNode;
  /** Names the list for a screen reader when no visible heading does. */
  label?: string;
  children: ReactNode;
  className?: string;
}

/** Rows in one card, a line between each (reference document, section 10.12). */
export function ListCard({ header, label, children, className }: ListCardProps) {
  return (
    <section
      aria-label={label}
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
    >
      {header}
      <ul className="divide-y">{children}</ul>
    </section>
  );
}

export function GroupHeader({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-t-xl border-b bg-tile px-4 py-2.5">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      {aside && <span className="text-[13px] text-muted-foreground tabular-nums">{aside}</span>}
    </div>
  );
}

interface ListRowProps {
  to: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The row's figure, right-aligned: a quantity or an amount. */
  figure?: ReactNode;
  /** Before the text: initials or an icon tile. */
  leading?: ReactNode;
  /** After the title, on its line. */
  badge?: ReactNode;
  /** After the link, outside it: a menu button. Replaces the chevron. */
  trailing?: ReactNode;
}

/** One tappable row: the whole line leads to the record. */
export function ListRow({ to, title, subtitle, figure, leading, badge, trailing }: ListRowProps) {
  return (
    <li className="relative flex items-center gap-1 pr-1">
      <Link
        to={to}
        className={cn(
          'flex min-h-15 min-w-0 grow items-center gap-3 rounded-xl py-2.5 pl-4 outline-none',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50',
          trailing ? 'pr-1' : 'pr-2',
        )}
      >
        {leading}
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{title}</span>
            {badge}
          </span>
          {subtitle && <span className="text-[13px] text-muted-foreground">{subtitle}</span>}
        </span>
        {figure !== undefined && (
          <span className="font-semibold whitespace-nowrap tabular-nums">{figure}</span>
        )}
        {!trailing && (
          <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
        )}
      </Link>
      {trailing}
    </li>
  );
}
