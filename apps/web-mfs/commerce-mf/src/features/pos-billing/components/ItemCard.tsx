import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Package, Plus } from 'lucide-react';
import type { PosTerminalSellableItemData } from '@/schemas/price-lists';

interface ItemCardProps {
  item: PosTerminalSellableItemData;
  cartQuantity: number;
  onAdd: (item: PosTerminalSellableItemData) => void;
}

export const ItemCard = ({ item, cartQuantity, onAdd }: ItemCardProps) => {
  const effectivePrice = item.priceOverride ?? item.basePrice;
  const disabled = effectivePrice == null;
  const showVariantName = item.itemVariantName && item.itemVariantName !== item.itemName;

  const handleAdd = () => {
    if (disabled) return;
    onAdd(item);
  };

  return (
    <Card className="p-4 flex flex-col gap-3 h-full hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="size-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
          <Package className="size-5 text-muted-foreground" />
        </div>
        {item.categoryName ? (
          <Badge variant="secondary" className="shrink-0 capitalize">
            {item.categoryName}
          </Badge>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-1">
        <Typography variant="subtitle2" className="leading-snug line-clamp-2">
          {item.itemName}
        </Typography>
        {showVariantName ? (
          <Typography variant="body2" intent="muted" className="line-clamp-2">
            {item.itemVariantName}
          </Typography>
        ) : null}
        {item.itemVariantSku ? (
          <Typography variant="caption">{item.itemVariantSku}</Typography>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <Typography variant="caption">{item.priceListName}</Typography>
      </div>

      <Typography variant="subtitle1">
        {effectivePrice == null ? '—' : `₹${effectivePrice.toLocaleString()}`}
      </Typography>

      <Button
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={handleAdd}
        startAdornment={<Plus className="size-4" />}
        endAdornment={
          cartQuantity > 0 ? (
            <Typography variant="caption" className="tabular-nums">
              {cartQuantity} in cart
            </Typography>
          ) : undefined
        }
      >
        Add to Cart
      </Button>
    </Card>
  );
};
