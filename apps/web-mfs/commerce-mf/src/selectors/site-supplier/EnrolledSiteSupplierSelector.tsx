import type { SelectProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';
import { SiteSupplierSelector } from './SiteSupplierSelector';

// The suppliers enrolled at the session site — the only ones it can raise purchase orders and purchases with
export const EnrolledSiteSupplierSelector = forwardRef<
  HTMLButtonElement,
  DistributiveOmit<SelectProps, 'optionsEndpoint'>
>((props, ref) => <SiteSupplierSelector ref={ref} enrollmentStatus="ENROLLED" {...props} />);
EnrolledSiteSupplierSelector.displayName = 'EnrolledSiteSupplierSelector';
