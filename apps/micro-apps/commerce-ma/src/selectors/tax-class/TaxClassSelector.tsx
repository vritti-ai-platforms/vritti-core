import { gql } from '@apollo/client';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';
import { forwardRef } from 'react';
import type { View } from 'react-native';

export type TaxClassSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `taxClassesOptions` resolver,
// which reuses the existing tax-class `select`.
const TAX_CLASSES_OPTIONS = gql`
  query TaxClassesOptions($input: SelectOptionsInput) {
    taxClassesOptions(input: $input) {
      options {
        value
        label
        description
        groupId
        additionals
      }
      groups {
        id
        name
      }
      hasMore
    }
  }
`;

// Pre-configured Select for tax-class selection with async search.
export const TaxClassSelector = forwardRef<View, TaxClassSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Tax class"
    placeholder="Select tax class"
    searchable
    optionsQuery={TAX_CLASSES_OPTIONS}
    optionsDataKey="taxClassesOptions"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
    {...props}
  />
));
TaxClassSelector.displayName = 'TaxClassSelector';
// Lets quantum <Form> bind this by `name` (value/onChange) like any field.
Object.assign(TaxClassSelector, { fieldBinding: { valueProp: 'value', changeProp: 'onChange' } });
