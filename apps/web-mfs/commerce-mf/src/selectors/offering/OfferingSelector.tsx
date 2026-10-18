import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export interface OfferingSelectorProps extends SelectProps {
  // Drops the offerings this catalog already lists every active variant of — offering one would
  // only lead to a variant step with nothing left in it
  catalogId?: string;
}

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', descriptionKey: 'code' } as const;

// Pre-configured Select for offering selection with async search
export const OfferingSelector = forwardRef<HTMLButtonElement, OfferingSelectorProps>(
  ({ catalogId, fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Offering"
      placeholder="Select offering"
      searchable
      optionsEndpoint="commerce-api/select-api/offerings"
      {...props}
      params={{ ...params, ...(catalogId ? { catalogId } : {}) }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
OfferingSelector.displayName = 'OfferingSelector';
