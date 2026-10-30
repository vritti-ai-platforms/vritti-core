import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type SupplierSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'displayName',
  descriptionKey: 'currencyCode',
  additionalKeys: 'currencyCode,currencyCodes,purchasingBlocked',
} as const;

const ENROLLMENT_LABELS: Record<string, string> = { ENROLLED: 'Enrolled', NOT_ENROLLED: 'Not Enrolled' };

// Currencies, then — when a `siteId` param asked for it — the enrollment status there, then a purchasing block
function defaultTransformDescription(value: string, option: SelectOption): string {
  const additionals = option.additionals ?? {};
  const currencyCode = Array.isArray(additionals.currencyCodes)
    ? additionals.currencyCodes.join(', ')
    : typeof additionals.currencyCode === 'string'
      ? additionals.currencyCode.trim()
      : '';
  const enrollment =
    typeof additionals.enrollmentStatus === 'string' ? ENROLLMENT_LABELS[additionals.enrollmentStatus] : '';
  const blocked = additionals.purchasingBlocked === true ? 'Purchasing blocked' : '';
  const parts = [currencyCode || value, enrollment, blocked].filter(Boolean);
  return parts.join(' · ');
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
