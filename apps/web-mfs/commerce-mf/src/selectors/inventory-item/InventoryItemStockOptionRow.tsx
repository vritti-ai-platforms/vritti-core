import { cn } from '@vritti/quantum-ui/cn';
import type { SingleSelectOptionRenderProps } from '@vritti/quantum-ui/Select';
import { Check } from 'lucide-react';
import type React from 'react';
import { StockLevelsCell } from '@/components/inventory-items/StockLevelsCell';
import { siteStockLevelsAdditionalsSchema } from '@/schemas/inventory-items';

// An item picked for a site: its name over its stock there against its levels, drawn as the stock tables draw it
export function InventoryItemStockOptionRow({ option, selected, onSelect }: SingleSelectOptionRenderProps) {
  const stock = siteStockLevelsAdditionalsSchema.safeParse(option.additionals);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={0}
      className={cn(
        'relative flex w-full cursor-default flex-col gap-1 rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none',
        'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
        selected && 'bg-accent/50',
      )}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className="truncate font-medium">{option.label || '—'}</span>
      {stock.success && <StockLevelsCell stock={stock.data} uomSymbol={stock.data.uomSymbol} />}
      <span className="absolute top-2.5 right-2 flex size-4 items-center justify-center">
        {selected && <Check className="size-4" />}
      </span>
    </div>
  );
}
