import { type ClearableSelectProps, Select } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type PurchaseSelectorProps = DistributiveOmit<ClearableSelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'purchaseNumber',
  descriptionKey: 'stage',
} as const;

export const PurchaseSelector = forwardRef<HTMLButtonElement, PurchaseSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Purchase"
    placeholder="Select purchase"
    searchable
    clearable
    optionsEndpoint="commerce-api/select-api/purchases"
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
PurchaseSelector.displayName = 'PurchaseSelector';
