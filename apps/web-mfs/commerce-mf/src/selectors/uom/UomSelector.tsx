import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type UomSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  additionalKeys: 'allowDecimal',
  groupIdKey: 'dimensionId',
} as const;

// Pre-configured Select for unit of measure selection, grouped by dimension
export const UomSelector = forwardRef<HTMLButtonElement, UomSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Unit of Measure"
    placeholder="Select unit"
    searchable
    optionsEndpoint="commerce-api/select-api/uom"
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
UomSelector.displayName = 'UomSelector';
