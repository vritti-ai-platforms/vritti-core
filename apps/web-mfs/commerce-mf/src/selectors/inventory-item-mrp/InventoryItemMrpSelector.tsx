import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export interface InventoryItemMrpSelectorProps extends SelectProps {
  variantId: string;
  currencyCode?: string;
  catalogId?: string;
}

// Only the value is named — the label and description are composed server-side, where the currency is known
const DEFAULT_FIELD_KEYS = { valueKey: 'id' } as const;

// Pre-configured Select for the MRPs a variant could be listed at, found through its bill of materials
export const InventoryItemMrpSelector = forwardRef<HTMLButtonElement, InventoryItemMrpSelectorProps>(
  ({ variantId, currencyCode, catalogId, fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="MRPs"
      placeholder="Any batch"
      optionsEndpoint="commerce-api/select-api/inventory-item-mrps"
      {...props}
      params={{
        ...params,
        variantId,
        ...(currencyCode ? { currencyCode } : {}),
        ...(catalogId ? { catalogId } : {}),
      }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
InventoryItemMrpSelector.displayName = 'InventoryItemMrpSelector';
