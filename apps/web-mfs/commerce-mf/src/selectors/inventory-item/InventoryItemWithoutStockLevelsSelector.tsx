import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type InventoryItemWithoutStockLevelsSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'sku',
  groupIdKey: 'categoryId',
} as const;

// Pre-configured Select for the items with no stock levels at the current site yet, grouped by category
export const InventoryItemWithoutStockLevelsSelector = forwardRef<
  HTMLButtonElement,
  InventoryItemWithoutStockLevelsSelectorProps
>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Inventory Item"
    placeholder="Select inventory item"
    searchable
    optionsEndpoint="commerce-api/select-api/inventory-items/without-stock-levels"
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
InventoryItemWithoutStockLevelsSelector.displayName = 'InventoryItemWithoutStockLevelsSelector';
