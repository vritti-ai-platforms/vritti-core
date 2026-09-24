import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type LotSelectorParams = { inventoryItemId?: string };

export type LotSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params?: LotSelectorParams;
};

// Pre-configured Select for inventory item lot selection (scoped to a single item)
export const LotSelector = forwardRef<HTMLButtonElement, LotSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Lot"
    placeholder="Select or type a lot number"
    searchable
    optionsEndpoint="commerce-api/select-api/inventory-item-lots"
    params={params}
    fieldKeys={{ valueKey: 'id', labelKey: 'lotNumber' }}
    {...props}
  />
));
LotSelector.displayName = 'LotSelector';
