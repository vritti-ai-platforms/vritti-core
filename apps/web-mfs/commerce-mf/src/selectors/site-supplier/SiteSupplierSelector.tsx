import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';
import type { SupplierEnrollmentStatus } from '@/schemas/supplier-enrollments';

export type SiteSupplierSelectorProps = DistributiveOmit<SelectProps, 'optionsEndpoint'> & {
  // Narrows to the suppliers enrolled (or not) at the session site; every supplier of the legal entity when omitted
  enrollmentStatus?: SupplierEnrollmentStatus;
  // Lists only suppliers effectively active at the session site
  activeOnly?: boolean;
};

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'displayName',
  descriptionKey: 'currencyCode',
  additionalKeys:
    'code,currencyCode,currencyCodes,defaultPaymentTermId,paymentTermId,enrollmentStatus,isActive,purchasingBlocked',
} as const;

const ENROLLMENT_LABELS: Record<SupplierEnrollmentStatus, string> = {
  ENROLLED: 'Enrolled',
  NOT_ENROLLED: 'Not Enrolled',
};

// Currencies, then the enrollment status at the site, then whether it supplies the picker's item there, then a purchasing
// block
function describeSupplier(value: string, option: SelectOption): string {
  const additionals = option.additionals ?? {};
  const currencyCode = Array.isArray(additionals.currencyCodes)
    ? additionals.currencyCodes.join(', ')
    : typeof additionals.currencyCode === 'string'
      ? additionals.currencyCode.trim()
      : '';
  const status = additionals.enrollmentStatus;
  const enrollment = status === 'ENROLLED' || status === 'NOT_ENROLLED' ? ENROLLMENT_LABELS[status] : '';
  const supplies = additionals.suppliesItem === true ? 'Supplies this item' : '';
  const blocked = additionals.purchasingBlocked === true ? 'Purchasing blocked' : '';
  return [currencyCode || value, enrollment, supplies, blocked].filter(Boolean).join(' · ');
}

// Pre-configured Select over the legal entity's suppliers as the session site sees them; form pickers offer only active ones
export const SiteSupplierSelector = forwardRef<HTMLButtonElement, SiteSupplierSelectorProps>(
  ({ fieldKeys, enrollmentStatus, activeOnly = true, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Supplier"
      placeholder="Select supplier"
      searchable
      optionsEndpoint="commerce-api/select-api/site-suppliers"
      transformDescription={describeSupplier}
      {...props}
      params={{
        ...params,
        ...(enrollmentStatus ? { enrollmentStatus } : {}),
        ...(activeOnly ? { activeOnly: true } : {}),
      }}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
SiteSupplierSelector.displayName = 'SiteSupplierSelector';
