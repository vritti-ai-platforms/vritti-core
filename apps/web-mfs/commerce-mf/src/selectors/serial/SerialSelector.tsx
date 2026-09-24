import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type SerialSelectorParams = { quantId?: string };

export type SerialSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params?: SerialSelectorParams;
};

// Pre-configured Select for picking available physical serials scoped to a quant.
export const SerialSelector = forwardRef<HTMLButtonElement, SerialSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Serial"
    placeholder="Select serial number"
    searchable
    optionsEndpoint="commerce-api/select-api/inventory-item-serials"
    params={params}
    fieldKeys={{ valueKey: 'id', labelKey: 'serialNumber' }}
    {...props}
  />
));
SerialSelector.displayName = 'SerialSelector';
