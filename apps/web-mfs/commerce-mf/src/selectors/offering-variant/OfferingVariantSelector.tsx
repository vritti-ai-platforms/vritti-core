import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export interface OfferingVariantSelectorProps extends SelectProps {
  offeringId?: string;
  catalogId?: string;
}

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', descriptionKey: 'code' } as const;

// The offering name alone is shared by every sibling, so its dimension values are what tell them apart
function defaultTransformLabel(label: string, option: SelectOption): string {
  const facets = typeof option.additionals?.facets === 'string' ? option.additionals.facets : '';
  return facets ? `${label} · ${facets}` : label;
}

// Pre-configured Select for offering variants — one offering's when offeringId is given, every reachable one's otherwise
export const OfferingVariantSelector = forwardRef<HTMLButtonElement, OfferingVariantSelectorProps>(
  ({ offeringId, catalogId, fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Variant"
      placeholder="Select variant"
      searchable
      optionsEndpoint="commerce-api/select-api/offering-variants"
      transformLabel={defaultTransformLabel}
      {...props}
      params={{ ...params, ...(offeringId ? { offeringId } : {}), ...(catalogId ? { catalogId } : {}) }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
OfferingVariantSelector.displayName = 'OfferingVariantSelector';
