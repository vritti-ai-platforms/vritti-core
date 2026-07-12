import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Plus, SlidersHorizontal } from 'lucide-react';
import type { PosSellableItem } from '../hooks/useTerminalSellables';

interface ItemCardProps {
  item: PosSellableItem;
  index: number;
  onSelect: (item: PosSellableItem) => void;
}

export const ItemCard = ({ item, index, onSelect }: ItemCardProps) => {
  const fmt = useFormatters();
  const hasOptions = item.variantCount > 1 || item.modifierGroupCount > 0;
  const optionLabel = item.variantCount > 1 ? 'Options' : 'Add-ons';
  const isRange = item.priceRange != null && item.priceRange.min.value !== item.priceRange.max.value;
  const priceText = item.priceRange ? fmt.currency(item.priceRange.min).primary : '—';

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        'pos-tile-reveal pos-tile group relative flex h-full min-h-37.5 cursor-pointer select-none flex-col',
        'overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-sm backdrop-blur-sm',
        'transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card',
        'hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.75)] active:translate-y-0 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      )}
      style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/0 to-transparent transition-all duration-300 group-hover:via-primary/80"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="flex items-center justify-between gap-2">
        {item.categoryName ? (
          <span className="truncate rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.categoryName}
          </span>
        ) : (
          <span />
        )}
        {hasOptions ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-border/70 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3" />
            {optionLabel}
          </span>
        ) : null}
      </div>

      <Typography
        variant="subtitle1"
        className="mt-3 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground"
      >
        {item.name}
      </Typography>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div className="min-w-0">
          {isRange ? (
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">from</div>
          ) : null}
          <div className="truncate font-mono text-lg font-bold tabular-nums text-foreground">{priceText}</div>
        </div>
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <Plus className="size-4" />
        </span>
      </div>
    </button>
  );
};
