import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

type CatalogSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint' | 'fieldKeys'>;

export const CatalogSelector = forwardRef<HTMLButtonElement, CatalogSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Catalog"
    placeholder="Select catalog"
    searchable
    optionsEndpoint="commerce-api/select-api/catalogs"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));

CatalogSelector.displayName = 'CatalogSelector';
