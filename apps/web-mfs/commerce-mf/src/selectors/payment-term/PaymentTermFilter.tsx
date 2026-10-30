import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type PaymentTermFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string };

// Pre-configured SelectFilter for payment term filtering with async search
export const PaymentTermFilter = Object.assign(
  forwardRef<HTMLButtonElement, PaymentTermFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="paymentTermId"
      label="Payment Term"
      placeholder="Select payment term"
      optionsEndpoint="commerce-api/select-api/payment-terms"
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
      {...props}
    />
  )),
  { displayName: 'PaymentTermFilter', defaultLabel: 'Payment Term', defaultName: 'paymentTermId' },
);
