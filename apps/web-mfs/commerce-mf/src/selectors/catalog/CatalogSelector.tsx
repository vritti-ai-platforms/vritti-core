import { Select } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

type CatalogSelectorProps = Omit<React.ComponentProps<typeof Select>, 'optionsEndpoint' | 'fieldKeys'>;

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
