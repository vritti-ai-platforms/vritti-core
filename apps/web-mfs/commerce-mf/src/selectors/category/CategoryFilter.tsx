import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';
import { formatCategoryPath } from './CategorySelector';

export type CategoryFilterProps = Omit<SelectFilterProps, 'optionsEndpoint' | 'name'> & { name?: string };

// Pre-configured SelectFilter for category filtering with async search
export const CategoryFilter = Object.assign(
  forwardRef<HTMLButtonElement, CategoryFilterProps>((props, ref) => (
    <SelectFilter
      ref={ref}
      name="categoryId"
      label="Category"
      placeholder="Select category"
      optionsEndpoint="commerce-api/select-api/categories"
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'path' }}
      transformDescription={formatCategoryPath}
      {...props}
      params={{ role: 'CATEGORY', status: 'active', ...props.params }}
    />
  )),
  { displayName: 'CategoryFilter', defaultLabel: 'Category', defaultName: 'categoryId' },
);
