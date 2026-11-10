import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';

export type EnrolledSiteSelectorProps = Omit<SelectProps, 'optionsEndpoint'> & {
  supplierId: string | undefined;
  isEnrolled?: boolean;
};

// Pre-configured Select over the legal entity's sites by one supplier's enrollments; inert until the supplier is known
export const EnrolledSiteSelector = forwardRef<HTMLButtonElement, EnrolledSiteSelectorProps>(
  ({ supplierId, isEnrolled = true, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Site"
      placeholder={supplierId ? 'Select site' : 'Select a supplier first'}
      searchable
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
      {...props}
      disabled={!supplierId || props.disabled}
      optionsEndpoint={supplierId ? 'select-api/sites' : undefined}
      params={supplierId ? { ...params, supplierId, isEnrolled, ...(isEnrolled ? { isActive: true } : {}) } : undefined}
    />
  ),
);
EnrolledSiteSelector.displayName = 'EnrolledSiteSelector';
