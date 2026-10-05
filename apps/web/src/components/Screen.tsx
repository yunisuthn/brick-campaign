import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/**
 * The column every screen sits in: the phone's width, then wider from 640 pixels so a list or a
 * form uses the room a tablet or a computer gives it, still centred and short enough to read.
 * `wide` is for a screen of side-by-side cards, the dashboard, that lays them out itself.
 */
export function Screen({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-5 pb-8 sm:max-w-2xl sm:px-6 sm:pt-6 lg:px-8 lg:pt-8',
        wide && 'lg:max-w-5xl',
        className,
      )}
    >
      {children}
    </main>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  /** Under the title, smaller: the campaign the screen shows, or what the record is. */
  subtitle?: ReactNode;
  /** A detail screen's way back to its list, above the title. */
  back?: { to: string; label: string };
  /** Beside the title, at the far end. */
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, back, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {back && (
        <Link
          to={back.to}
          className="-mt-2 -ml-1.5 flex min-h-11 items-center gap-1 self-start rounded-md pr-2 text-sm font-medium text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden="true" className="size-[18px]" />
          {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
        {action}
      </div>
      {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
