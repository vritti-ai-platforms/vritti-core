import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type PurchaseOrderSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'poNumber',
  additionalKeys: 'currencyCode,exchangeRate,exchangeRateType',
} as const;

export const PurchaseOrderSelector = forwardRef<HTMLButtonElement, PurchaseOrderSelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Purchase Order"
      placeholder="Select purchase order"
      searchable
      clearable
      optionsEndpoint="commerce-api/select-api/purchase-orders"
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
PurchaseOrderSelector.displayName = 'PurchaseOrderSelector';
