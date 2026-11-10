import { Badge } from '@vritti/quantum-ui/Badge';
import { cn } from '@vritti/quantum-ui/cn';
import { formatCurrency } from '@vritti/quantum-ui/money';
import {
  Select,
  type SelectOption,
  type SelectProps,
  type SingleSelectOptionRenderProps,
} from '@vritti/quantum-ui/Select';
import { Check, Gift } from 'lucide-react';
import type React from 'react';
import { forwardRef } from 'react';

export type SupplierItemSelectorParams = {
  supplierId?: string;
  purchaseOrderId?: string;
  excludeOnGoodsReceiptId?: string;
};

export type SupplierItemSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params?: SupplierItemSelectorParams;
};

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'tracking',
  groupIdKey: 'categoryId',
  additionalKeys:
    'symbol,unitPrice,currencyCode,schemeBuyQty,schemeFreeQty,hasScheme,allowDecimal,inventoryItemId,uomId,minOrderQuantity',
} as const;

// The parts of an option the label and the row are built from; the price is absent when none is in force
function optionParts(option: SelectOption) {
  const additionals = option.additionals ?? {};
  const rawPrice = additionals.unitPrice;
  const currencyCode = typeof additionals.currencyCode === 'string' ? additionals.currencyCode : null;
  return {
    name: option.label.replace(/\s-\s[^-]+$/, ''),
    uom: typeof additionals.symbol === 'string' ? additionals.symbol.trim() : '',
    price: rawPrice != null && currencyCode != null ? formatCurrency(String(rawPrice), currencyCode) : null,
    scheme:
      additionals.hasScheme === true && additionals.schemeBuyQty != null && additionals.schemeFreeQty != null
        ? `${additionals.schemeBuyQty} + ${additionals.schemeFreeQty} free`
        : null,
  };
}

// The closed field's text: "Item (uom) · price"
function defaultTransformLabel(_label: string, option: SelectOption): string {
  const { name, uom, price } = optionParts(option);
  const item = uom ? `${name} (${uom})` : name;
  return price ? `${item} · ${price}` : item;
}

// Humanises the inventory_items.tracking enum served as the option description.
function defaultTransformDescription(value: string): string {
  switch (value) {
    case 'QUANTITY':
      return 'Quantity';
    case 'LOT':
      return 'Lot';
    case 'SERIAL':
      return 'Serial';
    case 'LOT_SERIAL':
      return 'Lot + Serial';
    default:
      return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// Item name over its unit, tracking and scheme; the price per unit on the right, or "No price" when none is in force
function SupplierItemOptionRow({ option, selected, onSelect }: SingleSelectOptionRenderProps) {
  const { name, uom, price, scheme } = optionParts(option);

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
        'relative flex w-full cursor-default items-center gap-3 rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none',
        'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
        selected && 'bg-accent/50',
      )}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate">{name || '—'}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {uom && (
            <Badge variant="outline" className="px-1.5 py-0 font-mono text-xs">
              {uom}
            </Badge>
          )}
          {option.description && <span>{defaultTransformDescription(option.description)}</span>}
          {scheme && (
            <Badge variant="success" className="gap-1 px-1.5 py-0 text-xs">
              <Gift className="size-3" />
              {scheme}
            </Badge>
          )}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {price ? (
          <>
            <span className="block font-mono text-sm tabular-nums">{price}</span>
            {uom && <span className="block text-xs text-muted-foreground">per {uom}</span>}
          </>
        ) : (
          <span className="text-xs italic text-muted-foreground">No price</span>
        )}
      </span>
      <span className="absolute right-2 flex size-4 items-center justify-center">
        {selected && <Check className="size-4" />}
      </span>
    </div>
  );
}

export const SupplierItemSelector = forwardRef<HTMLButtonElement, SupplierItemSelectorProps>(
  ({ fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Supplier Item"
      placeholder="Select supplier item"
      searchable
      optionsEndpoint="commerce-api/select-api/supplier-items"
      params={params}
      transformLabel={defaultTransformLabel}
      transformDescription={defaultTransformDescription}
      renderOption={(rowProps) => <SupplierItemOptionRow {...rowProps} />}
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
SupplierItemSelector.displayName = 'SupplierItemSelector';
