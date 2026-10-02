import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/** The column every redesigned screen sits in: phone width, centred above it. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn('ui mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-5 pb-8', className)}
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
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
