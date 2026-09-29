import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  /** A swatch before the label, the colour of this figure's segment in a bar beside it. */
  swatchClassName?: string;
}

/** A small tile with one figure, on a light beige ground. */
export function StatCard({ label, value, swatchClassName }: StatCardProps) {
  return (
    <div className="rounded-lg bg-tile px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {swatchClassName && (
          <span
            aria-hidden="true"
            className={cn('size-2 shrink-0 rounded-full', swatchClassName)}
          />
        )}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
