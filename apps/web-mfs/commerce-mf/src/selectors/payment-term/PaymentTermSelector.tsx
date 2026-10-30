import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type PaymentTermSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

export const PaymentTermSelector = forwardRef<HTMLButtonElement, PaymentTermSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Payment Term"
    placeholder="Select payment term"
    searchable
    optionsEndpoint="commerce-api/select-api/payment-terms"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
PaymentTermSelector.displayName = 'PaymentTermSelector';
