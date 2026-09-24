import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type PurchaseOrderFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string };

// Pre-configured SelectFilter for purchase order filtering with async search
export const PurchaseOrderFilter = Object.assign(
  forwardRef<HTMLButtonElement, PurchaseOrderFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="purchaseOrderId"
      label="Purchase Order"
      optionsEndpoint="commerce-api/select-api/purchase-orders"
      fieldKeys={{ valueKey: 'id', labelKey: 'poNumber' }}
      {...props}
    />
  )),
  { displayName: 'PurchaseOrderFilter', defaultLabel: 'Purchase Order', defaultName: 'purchaseOrderId' },
);
