import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type RepositorySelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for git repository selection with async search; repositories are keyed by name
export const RepositorySelector = forwardRef<HTMLButtonElement, RepositorySelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Repository"
    placeholder="Select repository"
    searchable
    optionsEndpoint="gitea-api/select-api/repositories"
    fieldKeys={{ valueKey: 'name', labelKey: 'name' }}
    {...props}
  />
));
RepositorySelector.displayName = 'RepositorySelector';
