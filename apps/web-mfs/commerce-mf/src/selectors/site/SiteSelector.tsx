import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type SiteSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for site selection with async search (supports single and multi-select)
export const SiteSelector = forwardRef<HTMLButtonElement, SiteSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Site"
    placeholder="Select site"
    searchable
    optionsEndpoint="select-api/sites"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
SiteSelector.displayName = 'SiteSelector';
