import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type TaxComponentSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for tax-component selection (id → name, code as description); org-scoped server-side via RLS
export const TaxComponentSelector = forwardRef<HTMLButtonElement, TaxComponentSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Tax Component"
    placeholder="Select tax component"
    searchable
    optionsEndpoint="commerce-api/select-api/tax-components"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
TaxComponentSelector.displayName = 'TaxComponentSelector';
