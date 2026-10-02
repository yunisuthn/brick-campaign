import { Button } from '@/components/ui/button';

interface ConfirmStripProps {
  confirmLabel: string;
  keepLabel: string;
  onConfirm: () => void;
  onKeep: () => void;
  busy?: boolean;
}

/**
 * The second step before something is cancelled or deleted (reference document, section
 * 10.12): keeping it on the left, the red confirmation on the right.
 */
export function ConfirmStrip({
  confirmLabel,
  keepLabel,
  onConfirm,
  onKeep,
  busy,
}: ConfirmStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[10px] border border-destructive/20 bg-destructive/[0.07] p-3">
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-11 whitespace-normal"
        onClick={onKeep}
        disabled={busy}
      >
        {keepLabel}
      </Button>
      <Button
        type="button"
        variant="destructive"
        className="h-auto min-h-11 whitespace-normal"
        onClick={onConfirm}
        disabled={busy}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
