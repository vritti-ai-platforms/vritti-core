import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export interface OfferingVariantSelectorProps extends SelectProps {
  offeringId: string;
  catalogId?: string;
}

// No descriptionKey: a variant has no name column, so the endpoint composes one from its facets
const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'code' } as const;

// Pre-configured Select for the variants of one offering, keyed by Code
export const OfferingVariantSelector = forwardRef<HTMLButtonElement, OfferingVariantSelectorProps>(
  ({ offeringId, catalogId, fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Variant"
      placeholder="Select variant"
      searchable
      optionsEndpoint="commerce-api/select-api/offering-variants"
      {...props}
      params={{ ...params, offeringId, ...(catalogId ? { catalogId } : {}) }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
OfferingVariantSelector.displayName = 'OfferingVariantSelector';
