import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type SerialFilterParams = { quantId?: string };

export type SerialFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name' | 'params'> & {
  name?: string;
  params?: SerialFilterParams;
};

// Pre-configured SelectFilter for filtering serials within a quant
export const SerialFilter = Object.assign(
  forwardRef<HTMLButtonElement, SerialFilterProps>(({ params, ...props }, ref) => (
    <SelectFilter
      ref={ref}
      name="serialId"
      label="Serial"
      placeholder="Select serial"
      optionsEndpoint="commerce-api/select-api/inventory-item-serials"
      params={params}
      fieldKeys={{ valueKey: 'id', labelKey: 'serialNumber' }}
      {...props}
    />
  )),
  { displayName: 'SerialFilter', defaultLabel: 'Serial', defaultName: 'serialId' },
);
