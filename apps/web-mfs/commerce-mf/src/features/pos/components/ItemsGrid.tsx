import { Empty } from '@vritti/quantum-ui/Empty';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Package } from 'lucide-react';
import type { PosSellableItem } from '../hooks/useTerminalSellables';
import { ItemCard } from './ItemCard';

interface ItemsGridProps {
  items: PosSellableItem[];
  isLoading: boolean;
  onSelect: (item: PosSellableItem) => void;
}

export const ItemsGrid = ({ items, isLoading, onSelect }: ItemsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
        {Array.from({ length: 12 }, (_, i) => `tile-${i}`).map((key) => (
          <Skeleton key={key} className="h-37.5 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        icon={<Package />}
        title="No items available"
        description="Add available items to this terminal's catalog to start billing."
      />
    );
  }

  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
      {items.map((item, index) => (
        <ItemCard key={item.offeringId} item={item} index={index} onSelect={onSelect} />
      ))}
    </div>
  );
};
