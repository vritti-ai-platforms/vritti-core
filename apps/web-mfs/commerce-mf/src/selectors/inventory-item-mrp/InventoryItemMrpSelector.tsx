import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

type MrpSource =
  | { variantId: string; inventoryItemId?: never; uomId?: never }
  | { variantId?: never; inventoryItemId: string; uomId?: string };

export type InventoryItemMrpSelectorProps = SelectProps &
  MrpSource & {
    currencyCode?: string;
    catalogId?: string;
  };

// Only the value is named — the label and description are composed server-side, where the currency is known
const DEFAULT_FIELD_KEYS = { valueKey: 'id' } as const;

// Pre-configured Select for an item's MRPs — directly by inventory item (+ UOM), or through a variant's bill of materials
export const InventoryItemMrpSelector = forwardRef<HTMLButtonElement, InventoryItemMrpSelectorProps>(
  ({ variantId, inventoryItemId, uomId, currencyCode, catalogId, fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="MRPs"
      placeholder="Any batch"
      optionsEndpoint="commerce-api/select-api/inventory-item-mrps"
      {...props}
      params={{
        ...params,
        ...(variantId ? { variantId } : {}),
        ...(inventoryItemId ? { inventoryItemId } : {}),
        ...(uomId ? { uomId } : {}),
        ...(currencyCode ? { currencyCode } : {}),
        ...(catalogId ? { catalogId } : {}),
      }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
InventoryItemMrpSelector.displayName = 'InventoryItemMrpSelector';
