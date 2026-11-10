import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type SupplierFilterProps = DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & {
  name?: string;
  inventoryItemId?: string;
};

// Pre-configured SelectFilter for supplier filtering with async search; `inventoryItemId` keeps the suppliers of one item
export const SupplierFilter = Object.assign(
  forwardRef<HTMLButtonElement, SupplierFilterProps>(({ inventoryItemId, params, ...props }, ref) => (
    <SelectFilter
      ref={ref}
      name="supplierId"
      label="Supplier"
      placeholder="Select supplier"
      optionsEndpoint="commerce-api/select-api/suppliers"
      fieldKeys={{ valueKey: 'id', labelKey: 'displayName' }}
      {...props}
      params={inventoryItemId ? { ...params, inventoryItemId } : params}
    />
  )),
  { displayName: 'SupplierFilter', defaultLabel: 'Supplier', defaultName: 'supplierId' },
);
