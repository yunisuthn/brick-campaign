import { formatAmount } from '@/format';
import { cn } from '@/lib/utils';

interface AmountRowProps {
  label: string;
  /** Null when the API could not compute it for want of a rate. */
  value: number | null;
  /** What a null reads as: "Tarif à fixer", never zero. */
  unknownLabel?: string;
  strong?: boolean;
}

/**
 * A label on the left, its amount on the right, digits of equal width so a column of amounts
 * lines up. Meant inside a `<dl>`: the amount is the label's next sibling.
 */
export function AmountRow({ label, value, unknownLabel, strong = false }: AmountRowProps) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-4 py-1.5', strong && 'font-semibold')}
    >
      <dt className={cn(!strong && 'text-muted-foreground')}>{label}</dt>
      <dd className="text-right tabular-nums">
        {value === null ? (
          <em className="text-muted-foreground">{unknownLabel}</em>
        ) : (
          formatAmount(value)
        )}
      </dd>
    </div>
  );
}
