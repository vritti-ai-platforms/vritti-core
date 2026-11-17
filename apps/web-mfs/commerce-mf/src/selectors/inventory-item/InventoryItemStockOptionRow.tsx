import { Badge } from '@vritti/quantum-ui/Badge';
import { cn } from '@vritti/quantum-ui/cn';
import type { SingleSelectOptionRenderProps } from '@vritti/quantum-ui/Select';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Ban, Check } from 'lucide-react';
import type React from 'react';
import { SiteStockCell } from '@/components/inventory-items/SiteStockCell';
import { siteItemAdditionalsSchema } from '@/schemas/inventory-items';

// An item picked for a site: its name — marked when the picker's supplier has it set up there — over its stock there
// against its levels, drawn as the stock tables draw it; an item the site has blocked buying is shown disabled with why
export function InventoryItemStockOptionRow({ option, selected, onSelect }: SingleSelectOptionRenderProps) {
  const stock = siteItemAdditionalsSchema.safeParse(option.additionals);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (option.disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled}
      tabIndex={option.disabled ? -1 : 0}
      className={cn(
        'relative flex w-full cursor-default flex-col gap-1 rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none',
        option.disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
        selected && 'bg-accent/50',
      )}
      onClick={option.disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className="flex items-center gap-2">
        <span className="truncate font-medium">{option.label || '—'}</span>
        {option.additionals?.suppliedBySupplier === true && <Badge variant="secondary">Supplier item</Badge>}
      </span>
      {option.disabled && stock.success && (
        <Typography variant="caption" intent="error" className="flex items-center gap-1.5">
          <Ban className="size-3.5 shrink-0" />
          <span className="truncate">Purchasing blocked: {stock.data.blockedReason}</span>
        </Typography>
      )}
      {stock.success && <SiteStockCell stock={stock.data} uomSymbol={stock.data.uomSymbol} />}
      <span className="absolute top-2.5 right-2 flex size-4 items-center justify-center">
        {selected && <Check className="size-4" />}
      </span>
    </div>
  );
}
