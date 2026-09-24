import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type UserSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for user selection
export const UserSelector = forwardRef<HTMLButtonElement, UserSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="User"
    placeholder="Select user"
    searchable
    optionsEndpoint="users/select"
    fieldKeys={{ valueKey: 'id', labelKey: 'fullName', descriptionKey: 'email' }}
    {...props}
  />
));
UserSelector.displayName = 'UserSelector';
