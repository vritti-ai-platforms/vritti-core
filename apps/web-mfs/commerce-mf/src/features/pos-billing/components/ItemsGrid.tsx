import { Empty } from '@vritti/quantum-ui/Empty';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Package } from 'lucide-react';
import type { PosTerminalSellableItemData } from '@/schemas/price-lists';
import { ItemCard } from './ItemCard';

interface ItemsGridProps {
  items: PosTerminalSellableItemData[];
  cartQuantities: Record<string, number>;
  isLoading: boolean;
  onAdd: (item: PosTerminalSellableItemData) => void;
}

export const ItemsGrid = ({ items, cartQuantities, isLoading, onAdd }: ItemsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        icon={<Package />}
        title="No items available"
        description="Assign a price list with items to this terminal to start billing."
      />
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard
          key={item.itemVariantId}
          item={item}
          cartQuantity={cartQuantities[item.itemVariantId] ?? 0}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
};
