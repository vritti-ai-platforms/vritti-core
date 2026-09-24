import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export interface OfferingVariantSelectorProps extends SelectProps {
  // Variants are only meaningful within their offering, so the parent scopes every query
  offeringId: string;
}

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'sku', descriptionKey: 'name' } as const;

// Pre-configured Select for the variants of one offering, keyed by SKU
export const OfferingVariantSelector = forwardRef<HTMLButtonElement, OfferingVariantSelectorProps>(
  ({ offeringId, fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Variant"
      placeholder="Select variant"
      searchable
      optionsEndpoint="commerce-api/select-api/offering-variants"
      {...props}
      params={{ ...params, offeringId }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
OfferingVariantSelector.displayName = 'OfferingVariantSelector';
