import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type LotFilterParams = { inventoryItemId?: string };

export type LotFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name' | 'params'> & {
  name?: string;
  params?: LotFilterParams;
};

// Pre-configured SelectFilter for inventory item lot filtering
export const LotFilter = Object.assign(
  forwardRef<HTMLButtonElement, LotFilterProps>(({ params, ...props }, ref) => (
    <SelectFilter
      ref={ref}
      name="lotId"
      label="Lot"
      placeholder="Select lot"
      optionsEndpoint="commerce-api/select-api/inventory-item-lots"
      params={params}
      fieldKeys={{ valueKey: 'id', labelKey: 'lotNumber' }}
      {...props}
    />
  )),
  { displayName: 'LotFilter', defaultLabel: 'Lot', defaultName: 'lotId' },
);
