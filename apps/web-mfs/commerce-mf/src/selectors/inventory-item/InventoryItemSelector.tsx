import { Select, SelectFilter, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef, useState } from 'react';
import { purchasableStatusFilterOptions } from '@/schemas/inventory-items';
import { CategoryFilter } from '@/selectors/category';
import { InventoryItemStockOptionRow } from './InventoryItemStockOptionRow';

export type InventoryItemSelectorProps = SelectProps & {
  // Lists only the items this site carries, each with its stock and levels there, narrowed by category and status; the
  // ones it has blocked buying come disabled
  atSiteId?: string;
  // Lists only the items this site does not carry yet, the ones that can be added to it
  notAtSiteId?: string;
  // With atSiteId, marks the items this supplier has set up at the site and leaves out those the site buys only from
  // suppliers set up for them
  supplierId?: string;
};

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', groupIdKey: 'categoryId' } as const;

// Pre-configured Select for inventory item selection with async search, grouped by category
export const InventoryItemSelector = forwardRef<HTMLButtonElement, InventoryItemSelectorProps>(
  ({ fieldKeys, atSiteId, notAtSiteId, supplierId, params, ...props }, ref) => {
    const [stockStatus, setStockStatus] = useState<string[]>([]);
    const [categoryIds, setCategoryIds] = useState<string[]>([]);
    return (
      <Select
        ref={ref}
        label="Inventory Item"
        placeholder="Select inventory item"
        searchable
        optionsEndpoint="commerce-api/select-api/inventory-items"
        {...(atSiteId
          ? {
              renderOption: (row) => <InventoryItemStockOptionRow {...row} />,
              header: (
                <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                  <CategoryFilter
                    name="categoryIds"
                    placeholder="All"
                    multiple
                    mode="context"
                    value={categoryIds}
                    onChange={(result) => setCategoryIds(result ? [result.value].flat().map(String) : [])}
                  />
                  <SelectFilter
                    name="stockStatus"
                    label="Status"
                    placeholder="All"
                    multiple
                    mode="context"
                    options={purchasableStatusFilterOptions}
                    value={stockStatus}
                    onChange={(result) => setStockStatus(result ? [result.value].flat().map(String) : [])}
                  />
                </div>
              ),
            }
          : {})}
        {...props}
        params={{
          ...params,
          ...(atSiteId ? { atSiteId } : {}),
          ...(notAtSiteId ? { notAtSiteId } : {}),
          ...(atSiteId && supplierId ? { supplierId } : {}),
          ...(atSiteId && stockStatus.length > 0 ? { stockStatus: stockStatus.join(',') } : {}),
          ...(atSiteId && categoryIds.length > 0 ? { categoryIds: categoryIds.join(',') } : {}),
        }}
        fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
      />
    );
  },
);
InventoryItemSelector.displayName = 'InventoryItemSelector';
