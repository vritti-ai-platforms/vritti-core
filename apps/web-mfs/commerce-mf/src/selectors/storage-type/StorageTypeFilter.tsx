import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

export type StorageTypeFilterProps = DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & {
  name?: string;
};

// Pre-configured SelectFilter for storage type filtering with async search
export const StorageTypeFilter = Object.assign(
  forwardRef<HTMLButtonElement, StorageTypeFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="storageTypeId"
      label="Storage Type"
      placeholder="Select storage type"
      optionsEndpoint="commerce-api/select-api/storage-types"
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
      {...props}
    />
  )),
  { displayName: 'StorageTypeFilter', defaultLabel: 'Storage Type', defaultName: 'storageTypeId' },
);
