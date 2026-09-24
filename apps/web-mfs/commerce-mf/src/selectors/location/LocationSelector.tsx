import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type LocationSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'path',
  groupIdKey: 'locationRole',
} as const;

// Renders the parent breadcrumb from an ltree path, dropping the leaf segment shown as the option label.
export const formatLocationPath = (path: string): string =>
  path
    .split('.')
    .slice(0, -1)
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ');

// Pre-configured Select for location selection — server returns full ltree path as description
export const LocationSelector = forwardRef<HTMLButtonElement, LocationSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Location"
    placeholder="Select location"
    searchable
    optionsEndpoint="commerce-api/select-api/locations"
    transformDescription={formatLocationPath}
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
LocationSelector.displayName = 'LocationSelector';
