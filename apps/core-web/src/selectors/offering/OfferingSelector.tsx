import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type OfferingSelectorProps = SelectProps;

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', descriptionKey: 'code' } as const;

// Pre-configured Select for offering selection with async search
export const OfferingSelector = forwardRef<HTMLButtonElement, OfferingSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Offering"
    placeholder="Select offering"
    searchable
    optionsEndpoint="commerce-api/select-api/offerings"
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
OfferingSelector.displayName = 'OfferingSelector';
