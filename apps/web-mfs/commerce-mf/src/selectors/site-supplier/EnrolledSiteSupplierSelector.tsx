import type { SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef } from 'react';
import { SiteSupplierSelector } from './SiteSupplierSelector';

// The suppliers enrolled at the session site — the only ones it can raise purchase orders and purchases with
export const EnrolledSiteSupplierSelector = forwardRef<HTMLButtonElement, Omit<SelectProps, 'optionsEndpoint'>>(
  (props, ref) => <SiteSupplierSelector ref={ref} enrollmentStatus="ENROLLED" {...props} />,
);
EnrolledSiteSupplierSelector.displayName = 'EnrolledSiteSupplierSelector';
