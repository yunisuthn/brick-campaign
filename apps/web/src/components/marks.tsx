import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'warning' | 'brick' | 'success' | 'destructive';

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground',
  warning: 'bg-warning-surface text-warning-foreground',
  brick: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
};

/** A state in a word: a sale's status, a batch in the kiln, a payment's type. */
export function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md border-transparent px-2 font-semibold', tones[tone])}
    >
      {children}
    </Badge>
  );
}

/** "Rakoto Jean" -> "RJ": who a row is about, at a glance. */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase());
  return letters.join('') || '?';
}

export function Initials({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tile text-sm font-semibold text-primary"
    >
      {initials(name)}
    </span>
  );
}

export function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary"
    >
      <Icon className="size-5" />
    </span>
  );
}

/** A figure on the light beige tile: a total, what is left to collect. */
export function FigureTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-[10px] bg-tile px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold tabular-nums">{children}</span>
    </div>
  );
}

/** How much of a whole is done, as a bar; the figures say it in words next to it. */
export function Meter({ ratio, className }: { ratio: number; className?: string }) {
  const width = `${Math.round(Math.max(0, Math.min(ratio, 1)) * 100)}%`;
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
      <div className={cn('h-full rounded-full bg-primary', className)} style={{ width }} />
    </div>
  );
}
