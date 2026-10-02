import { SlidersHorizontal } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

interface FilterPanelProps {
  /** Whether any filter is set: the panel is then shown until closed. */
  active: boolean;
  /** What the list below adds up to, beside the button; null while there is nothing to add. */
  total: ReactNode;
  children: ReactNode;
}

/**
 * Filters behind a button, so the list starts high on the screen (reference document, section
 * 10.12), with the total of what is shown beside it.
 */
export function FilterPanel({ active, total, children }: FilterPanelProps) {
  const [open, setOpen] = useState<boolean | null>(null);
  const panelId = useId();
  const { t } = useTranslation();
  const shown = open ?? active;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          aria-expanded={shown}
          aria-controls={panelId}
          onClick={() => setOpen(!shown)}
        >
          <SlidersHorizontal aria-hidden="true" />
          {t('common.filters')}
        </Button>
        {total && (
          <p className="text-right text-sm text-muted-foreground">
            {t('common.totalShown')}{' '}
            <strong className="font-semibold text-foreground tabular-nums">{total}</strong>
          </p>
        )}
      </div>
      {shown && (
        <form
          id={panelId}
          aria-label={t('common.filters')}
          onSubmit={(event) => event.preventDefault()}
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
        >
          {children}
        </form>
      )}
    </>
  );
}

/** A label above a control that lives outside any form library: a filter's own state. */
export function FilterControl({
  label,
  children,
}: {
  label: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm leading-snug font-medium">
        {label}
      </label>
      {children(id)}
    </div>
  );
}
