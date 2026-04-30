import { Button } from '@vritti/quantum-ui/Button';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Minus, Package, Plus, X } from 'lucide-react';

export interface CartLineData {
  itemVariantId: string;
  itemName: string;
  itemVariantName: string;
  unitPrice: number;
  quantity: number;
}

interface CartLineProps {
  line: CartLineData;
  onUpdateQty: (itemVariantId: string, qty: number) => void;
  onRemove: (itemVariantId: string) => void;
}

export const CartLine = ({ line, onUpdateQty, onRemove }: CartLineProps) => {
  const showVariant = line.itemVariantName && line.itemVariantName !== line.itemName;
  const lineTotal = line.unitPrice * line.quantity;

  return (
    <div className="p-3 flex gap-3 items-start">
      <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        <Package className="size-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Typography variant="subtitle2" className="line-clamp-1">
              {line.itemName}
            </Typography>
            <Typography variant="caption" className="line-clamp-1">
              {showVariant
                ? `${line.itemVariantName} · ₹${line.unitPrice.toLocaleString()}`
                : `₹${line.unitPrice.toLocaleString()}`}
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onRemove(line.itemVariantId)}
            aria-label="Remove from cart"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onUpdateQty(line.itemVariantId, line.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </Button>
            <Typography variant="subtitle2" className="w-7 text-center">
              {line.quantity}
            </Typography>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => onUpdateQty(line.itemVariantId, line.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <Typography variant="subtitle2" className="font-semibold">
            ₹{lineTotal.toLocaleString()}
          </Typography>
        </div>
      </div>
    </div>
  );
};
