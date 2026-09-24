import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type InventoryItemSelectorProps = SelectProps;

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', groupIdKey: 'categoryId' } as const;

// Pre-configured Select for inventory item selection with async search, grouped by category
export const InventoryItemSelector = forwardRef<HTMLButtonElement, InventoryItemSelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Inventory Item"
      placeholder="Select inventory item"
      searchable
      optionsEndpoint="commerce-api/select-api/inventory-items"
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
InventoryItemSelector.displayName = 'InventoryItemSelector';
