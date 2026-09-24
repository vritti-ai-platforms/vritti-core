import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';
import type { SupplierItemSelectorParams } from './SupplierItemSelector';

export type SupplierItemFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name' | 'params'> & {
  name?: string;
  params?: SupplierItemSelectorParams;
};

// Pre-configured SelectFilter for supplier-item filtering, sharing SupplierItemSelector's params shape.
export const SupplierItemFilter = Object.assign(
  forwardRef<HTMLButtonElement, SupplierItemFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="supplierItemId"
      label="Supplier Item"
      placeholder="Select supplier item"
      optionsEndpoint="commerce-api/select-api/supplier-items"
      fieldKeys={{ valueKey: 'id', labelKey: 'name', groupIdKey: 'categoryId' }}
      {...props}
    />
  )),
  { displayName: 'SupplierItemFilter', defaultLabel: 'Supplier Item', defaultName: 'supplierItemId' },
);
