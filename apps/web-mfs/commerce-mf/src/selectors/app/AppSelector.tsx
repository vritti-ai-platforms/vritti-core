import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type AppSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for app selection with async search (supports single and multi-select)
export const AppSelector = forwardRef<HTMLButtonElement, AppSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="App"
    placeholder="Select app"
    searchable
    optionsEndpoint="select-api/apps"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
AppSelector.displayName = 'AppSelector';
