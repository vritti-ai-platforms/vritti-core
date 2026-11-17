import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type PaymentTermSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'> & {
  // Lists draft terms too — for navigation, never for picking a term a supplier will use
  allowUnpublished?: boolean;
};

export const PaymentTermSelector = forwardRef<HTMLButtonElement, PaymentTermSelectorProps>(
  ({ allowUnpublished, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Payment Term"
      placeholder="Select payment term"
      searchable
      optionsEndpoint="commerce-api/select-api/payment-terms"
      fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
      params={allowUnpublished ? { ...params, allowUnpublished: true } : params}
      {...props}
    />
  ),
);
PaymentTermSelector.displayName = 'PaymentTermSelector';
