import { useId, type ReactNode } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  /** Beside the title, at the far end: a button for what the section leads to. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** One block of a screen: a card named by its title, so it reads as a region to a screen reader. */
export function SectionCard({ title, action, className, children }: SectionCardProps) {
  const titleId = useId();
  return (
    <Card role="region" aria-labelledby={titleId} className={cn('gap-4 py-5', className)}>
      <CardHeader className="px-5">
        <CardTitle id={titleId} className="text-base">
          <h2>{title}</h2>
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="px-5">{children}</CardContent>
    </Card>
  );
}
