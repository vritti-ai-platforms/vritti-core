import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type TaxComponentSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'> & {
  country: string | undefined;
};

// Pre-configured Select over one country's tax components (id → name, code as description); inert until the country is known
export const TaxComponentSelector = forwardRef<HTMLButtonElement, TaxComponentSelectorProps>(
  ({ country, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Tax Component"
      placeholder={country ? 'Select tax component' : 'Select a country first'}
      searchable
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
      {...props}
      disabled={!country || props.disabled}
      optionsEndpoint={country ? 'commerce-api/select-api/tax-components' : undefined}
      params={country ? { ...params, country } : undefined}
    />
  ),
);
TaxComponentSelector.displayName = 'TaxComponentSelector';
