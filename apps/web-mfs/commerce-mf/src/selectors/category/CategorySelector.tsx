import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type CategorySelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Renders the parent breadcrumb from an ltree path, dropping the leaf segment shown as the option label.
export const formatCategoryPath = (path: string): string =>
  path
    .split('.')
    .slice(0, -1)
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ');

// Pre-configured Select for category selection — defaults to active leaf categories; override role/status via params
export const CategorySelector = forwardRef<HTMLButtonElement, CategorySelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Category"
    placeholder="Select category"
    searchable
    optionsEndpoint="commerce-api/select-api/categories"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'path' }}
    transformDescription={formatCategoryPath}
    {...props}
    params={{ role: 'CATEGORY', status: 'active', ...props.params }}
  />
));
CategorySelector.displayName = 'CategorySelector';
