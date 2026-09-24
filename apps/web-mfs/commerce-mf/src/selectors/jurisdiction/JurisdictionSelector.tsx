import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type JurisdictionSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

export const JurisdictionSelector = forwardRef<HTMLButtonElement, JurisdictionSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Jurisdiction"
    placeholder="Select jurisdiction"
    searchable
    optionsEndpoint="commerce-api/select-api/tax-jurisdictions"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
JurisdictionSelector.displayName = 'JurisdictionSelector';
