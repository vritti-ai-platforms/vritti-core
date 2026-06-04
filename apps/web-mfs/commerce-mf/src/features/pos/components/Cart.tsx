import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm, useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { CreditCard, Receipt, Trash2 } from 'lucide-react';
import type { CurrencyAmount } from '@/schemas/offerings';
import { CartLine, type CartLineData } from './CartLine';

interface CartProps {
  lines: CartLineData[];
  subtotal: CurrencyAmount | null;
  isPlacing: boolean;
  onUpdateQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onClear: () => void;
  onPlaceOrder: () => void;
}

export const Cart = ({ lines, subtotal, isPlacing, onUpdateQty, onRemove, onClear, onPlaceOrder }: CartProps) => {
  const confirm = useConfirm();
  const fmt = useFormatters();
  const itemCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const isEmpty = lines.length === 0;
  const totalText = subtotal == null ? '—' : fmt.currency(subtotal).primary;

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Clear cart?',
      description: 'This will remove all items from the current sale.',
      confirmLabel: 'Clear',
      variant: 'destructive',
    });
    if (ok) onClear();
  };

  return (
    <aside className="dark flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-gradient-to-b from-card to-background text-foreground shadow-[-16px_0_36px_-28px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Receipt className="size-5 text-muted-foreground" />
          <Typography variant="subtitle1" className="tracking-tight text-foreground">
            Order
          </Typography>
          {itemCount > 0 ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium tabular-nums text-primary">
              {itemCount}
            </span>
          ) : null}
        </div>
        {!isEmpty ? (
          <Button
            variant="destructive"
            size="sm"
            className="h-7"
            onClick={handleClear}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="pos-breathe grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Receipt className="size-7" />
            </div>
            <div>
              <Typography variant="subtitle1" className="text-foreground">
                No items yet
              </Typography>
              <Typography variant="caption" intent="muted" className="mt-1 block max-w-[200px]">
                Tap a product to start building this order.
              </Typography>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {lines.map((line) => (
              <CartLine key={line.lineId} line={line} onUpdateQty={onUpdateQty} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>

      <div className="relative border-t border-border/80 p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%)]" />
        <div className="relative space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono tabular-nums text-foreground">{totalText}</span>
            </div>
            <div className="flex items-end justify-between border-t border-border/60 pt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total due</div>
              <div
                key={subtotal?.value ?? 'empty'}
                className="pos-pop font-mono text-3xl font-bold leading-none tabular-nums text-foreground"
              >
                {totalText}
              </div>
            </div>
          </div>

          <Button
            className="pos-charge h-14 w-full text-base shadow-[0_14px_32px_-14px] shadow-primary/50"
            onClick={onPlaceOrder}
            disabled={isEmpty || isPlacing}
            isLoading={isPlacing}
            startAdornment={<CreditCard className="size-5" />}
            endAdornment={
              !isEmpty ? <span className="font-mono tabular-nums opacity-90">· {totalText}</span> : undefined
            }
          >
            Charge
          </Button>
        </div>
      </div>
    </aside>
  );
};
