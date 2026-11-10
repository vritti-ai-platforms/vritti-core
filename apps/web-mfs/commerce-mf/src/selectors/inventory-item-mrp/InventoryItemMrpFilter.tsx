import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type InventoryItemMrpFilterProps = DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & {
  name?: string;
  inventoryItemId: string;
};

// Pre-configured SelectFilter over an inventory item's MRPs — labels are composed server-side, where the currency is known
export const InventoryItemMrpFilter = Object.assign(
  forwardRef<HTMLButtonElement, InventoryItemMrpFilterProps>(({ inventoryItemId, params, ...props }, ref) => (
    <SelectFilter
      ref={ref}
      name="mrpIds"
      label="MRP"
      placeholder="Any"
      optionsEndpoint="commerce-api/select-api/inventory-item-mrps"
      fieldKeys={{ valueKey: 'id' }}
      {...props}
      params={{ ...params, inventoryItemId }}
    />
  )),
  { displayName: 'InventoryItemMrpFilter', defaultLabel: 'MRP', defaultName: 'mrpIds' },
);
