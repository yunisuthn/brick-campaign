import type { ComponentProps, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTranslation } from '@/i18n/I18nProvider';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { cn } from '@/lib/utils';

interface RouteSheetProps {
  title: string;
  description?: ReactNode;
  /** Where closing the sheet goes: the screen it was opened over. */
  closeTo: string;
  children: ReactNode;
}

/**
 * A form that rises from the bottom over the list it belongs to, open for as long as its route
 * is the current one (reference document, section 10.12): the address of an entry still means
 * something, and the phone's back button closes it. Closing, by the cross, the overlay or
 * Escape, goes back to `closeTo`.
 */
export function RouteSheet({ title, description, closeTo, children }: RouteSheetProps) {
  const navigate = useNavigate();
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) void navigate(closeTo);
      }}
    >
      <FormSheetContent {...(description === undefined ? { 'aria-describedby': undefined } : {})}>
        <SheetHeader className="pr-14">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description !== undefined && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </FormSheetContent>
    </Sheet>
  );
}

/**
 * Where a form sheet comes from: from the bottom on a phone, under the thumb; from 640 pixels a
 * panel on the right, full height, so the list it was opened over stays in view beside it.
 */
export function FormSheetContent({
  className,
  ...props
}: Omit<ComponentProps<typeof SheetContent>, 'side' | 'closeLabel'>) {
  const wide = useMediaQuery('(min-width: 40rem)');
  const { t } = useTranslation();
  return (
    <SheetContent
      side={wide ? 'right' : 'bottom'}
      closeLabel={t('common.close')}
      className={cn(
        'gap-0 overflow-y-auto',
        wide ? 'w-full sm:max-w-md' : 'mx-auto max-h-[92dvh] max-w-md rounded-t-xl',
        className,
      )}
      {...props}
    />
  );
}

/** Cancel on the left, the form's own action on the right, as the sale sheet has them. */
export function SheetActions({
  submitLabel,
  cancelLabel,
  busy,
  disabled,
  className,
}: {
  submitLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn('grid grid-cols-2 gap-3 pt-1', className)}>
      <SheetClose asChild>
        <Button type="button" variant="outline" className="h-auto min-h-11 whitespace-normal">
          {cancelLabel ?? t('common.cancel')}
        </Button>
      </SheetClose>
      <Button
        type="submit"
        className="h-auto min-h-11 whitespace-normal"
        disabled={busy || disabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
