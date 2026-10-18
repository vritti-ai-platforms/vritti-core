import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export interface InventoryItemMrpSelectorProps extends SelectProps {
  variantId: string;
  // What the listing will be priced in. A listing keyed to an MRP must be priced in that MRP's currency,
  // so naming it here keeps the options to the ones that could actually be chosen.
  currencyCode?: string;
  // Drops the MRPs this catalog already lists this variant at
  catalogId?: string;
}

// `fieldKeys` are column names the endpoint maps, not fields read here. Only the value is named: the
// label and the description are composed server-side, because an amount is minor units and a currency
// decides its decimals — and a multi-select renders plain strings, with no hook to format them in.
const DEFAULT_FIELD_KEYS = { valueKey: 'id' } as const;

// Pre-configured Select for the printed MRPs one variant could be listed at — found through its bill of
// materials, so it offers the prices on the packs the variant actually draws on and nothing else
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
