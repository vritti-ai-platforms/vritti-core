import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type UomFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string };

// Pre-configured SelectFilter for unit of measure filtering with async search
export const UomFilter = Object.assign(
  forwardRef<HTMLButtonElement, UomFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="uomId"
      label="Unit of Measure"
      placeholder="Select unit"
      optionsEndpoint="commerce-api/select-api/uom"
      fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
      {...props}
    />
  )),
  { displayName: 'UomFilter', defaultLabel: 'Unit of Measure', defaultName: 'uomId' },
);
