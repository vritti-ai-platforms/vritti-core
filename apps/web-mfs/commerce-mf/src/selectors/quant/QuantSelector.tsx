import { cn } from '@vritti/quantum-ui/cn';
import { Select, type SelectProps, type SingleSelectOptionRenderProps } from '@vritti/quantum-ui/Select';
import { Check } from 'lucide-react';
import type React from 'react';
import { forwardRef } from 'react';

export type QuantSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Custom option row: label=lotNumber (or inventoryItemName), description=locationPath (or lotNumber), qty+symbol on the right
function QuantOptionRow({ option, selected, onSelect }: SingleSelectOptionRenderProps) {
  const qty = option.additionals?.quantity;
  const symbol = option.additionals?.symbol as string | null | undefined;

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
        'relative flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 min-h-11 text-sm outline-hidden select-none',
        'hover:bg-accent hover:text-accent-foreground',
      )}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate">{option.label || '—'}</span>
        {option.description && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{option.description}</span>
        )}
      </span>
      {qty != null && (
        <span className="shrink-0 pr-5 text-xs tabular-nums text-muted-foreground">
          {String(qty)}
          {symbol ? ` ${symbol}` : ''}
        </span>
      )}
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {selected && <Check className="size-4" />}
      </span>
    </div>
  );
}

// Pre-configured Select for quant selection; pass params={{ inventoryItemId }} to scope to a specific item
export const QuantSelector = forwardRef<HTMLButtonElement, QuantSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Quant"
    placeholder="Select quant"
    searchable
    optionsEndpoint="commerce-api/select-api/inventory-item-quants"
    renderOption={(p) => <QuantOptionRow {...p} />}
    {...props}
  />
));

QuantSelector.displayName = 'QuantSelector';
