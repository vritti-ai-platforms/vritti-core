import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type CompanySelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for company selection with async search
export const CompanySelector = forwardRef<HTMLButtonElement, CompanySelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Company"
    placeholder="Search companies"
    searchable
    optionsEndpoint="commerce-api/select-api/companies"
    fieldKeys={{ valueKey: 'id', labelKey: 'displayName' }}
    {...props}
  />
));
CompanySelector.displayName = 'CompanySelector';
