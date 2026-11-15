import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type PurchaseFilterProps = DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & {
  name?: string;
};

// Pre-configured SelectFilter for purchase filtering with async search
export const PurchaseFilter = Object.assign(
  forwardRef<HTMLButtonElement, PurchaseFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="purchaseId"
      label="Purchase"
      placeholder="Select purchase"
      optionsEndpoint="commerce-api/select-api/purchases"
      fieldKeys={{ valueKey: 'id', labelKey: 'purchaseNumber', descriptionKey: 'stage' }}
      {...props}
    />
  )),
  { displayName: 'PurchaseFilter', defaultLabel: 'Purchase', defaultName: 'purchaseId' },
);
