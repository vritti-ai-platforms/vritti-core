import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type CostCategorySelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select over the organization's cost categories, each described by its kind
export const CostCategorySelector = forwardRef<HTMLButtonElement, CostCategorySelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Cost Category"
    placeholder="Select cost category"
    searchable
    optionsEndpoint="commerce-api/select-api/cost-categories"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'kind' }}
    {...props}
  />
));
CostCategorySelector.displayName = 'CostCategorySelector';
