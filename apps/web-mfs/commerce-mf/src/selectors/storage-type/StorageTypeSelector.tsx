import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type StorageTypeSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for storage type selection (id → name, code as description)
export const StorageTypeSelector = forwardRef<HTMLButtonElement, StorageTypeSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Storage Type"
    placeholder="Select storage type"
    searchable
    optionsEndpoint="commerce-api/select-api/storage-types"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
StorageTypeSelector.displayName = 'StorageTypeSelector';
