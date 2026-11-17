import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type TaxClassSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for tax-class selection (id → name, code as description); BU-scoped server-side via RLS
export const TaxClassSelector = forwardRef<HTMLButtonElement, TaxClassSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Tax Class"
    placeholder="Select tax class"
    searchable
    optionsEndpoint="commerce-api/select-api/tax-classes"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
TaxClassSelector.displayName = 'TaxClassSelector';
