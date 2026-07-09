import { Button } from '@vritti/quantum-ui/Button';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { majorToMinor, minorToMajor } from '@vritti/quantum-ui/money';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Minus, Plus, X } from 'lucide-react';
import type { CurrencyAmount } from '@/schemas/offerings';

export interface CartLineModifier {
  modifierGroupId: string;
  modifierOptionId: string;
  name: string;
  additionalPrice: string;
}

export interface CartLineData {
  lineId: string;
  offeringVariantId: string;
  offeringName: string;
  offeringVariantName: string;
  unitPrice: CurrencyAmount;
  modifiers: CartLineModifier[];
  quantity: number;
}

interface CartLineProps {
  line: CartLineData;
  onUpdateQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
}

// Sums the variant price and all modifier add-ons (minor units) for a single unit
function unitMinor(line: CartLineData): bigint {
  const { currency } = line.unitPrice;
  let total = BigInt(majorToMinor(line.unitPrice.value, currency));
  for (const modifier of line.modifiers) total += BigInt(modifier.additionalPrice);
  return total;
}

export const CartLine = ({ line, onUpdateQty, onRemove }: CartLineProps) => {
  const fmt = useFormatters();
  const { currency } = line.unitPrice;
  const showVariant = line.offeringVariantName && line.offeringVariantName !== line.offeringName;
  const lineTotal: CurrencyAmount = {
    currency,
    value: minorToMajor((unitMinor(line) * BigInt(line.quantity)).toString(), currency),
  };

  return (
    <div className="pos-line-in px-5 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography variant="subtitle2" className="line-clamp-2 font-semibold tracking-tight text-foreground">
            {line.offeringName}
          </Typography>
          {showVariant ? (
            <Typography variant="caption" intent="muted" className="line-clamp-1">
              {line.offeringVariantName}
            </Typography>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(line.lineId)}
          aria-label="Remove from cart"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {line.modifiers.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5 border-l-2 border-border/70 pl-2.5">
          {line.modifiers.map((modifier) => (
            <li key={modifier.modifierOptionId} className="flex justify-between gap-2">
              <Typography variant="caption" intent="muted" className="line-clamp-1">
                {modifier.name}
              </Typography>
              {BigInt(modifier.additionalPrice) > 0n ? (
                <Typography variant="caption" intent="muted" className="shrink-0 font-mono tabular-nums">
                  +{fmt.currency({ currency, value: minorToMajor(modifier.additionalPrice, currency) }).primary}
                </Typography>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background/50 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQty(line.lineId, line.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="size-3.5" />
          </Button>
          <Typography variant="subtitle2" className="w-7 text-center tabular-nums text-foreground">
            {line.quantity}
          </Typography>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQty(line.lineId, line.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        <Typography variant="subtitle2" className="font-mono font-semibold tabular-nums text-foreground">
          {fmt.currency(lineTotal).primary}
        </Typography>
      </div>
    </div>
  );
};
