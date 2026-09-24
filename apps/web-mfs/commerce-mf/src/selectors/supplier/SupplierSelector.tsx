import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type SupplierSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'currencyCode', // default to name, but transformDescription will show currency + payment terms if available
  additionalKeys: 'currencyCode,paymentTerms',
} as const;

function defaultTransformDescription(value: string, option: SelectOption): string {
  const currencyCode =
    typeof option.additionals?.currencyCode === 'string' ? option.additionals.currencyCode.trim() : '';
  const paymentTerms =
    typeof option.additionals?.paymentTerms === 'string' ? option.additionals.paymentTerms.trim() : '';
  const parts = [currencyCode, paymentTerms].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : value;
}

// Pre-configured Select for supplier selection with async search.
export const SupplierSelector = forwardRef<HTMLButtonElement, SupplierSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Supplier"
    placeholder="Select supplier"
    searchable
    optionsEndpoint="commerce-api/select-api/suppliers"
    transformDescription={defaultTransformDescription}
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
SupplierSelector.displayName = 'SupplierSelector';
