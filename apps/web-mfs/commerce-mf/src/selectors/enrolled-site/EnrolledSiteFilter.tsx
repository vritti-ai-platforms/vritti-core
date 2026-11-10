import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import type { DistributiveOmit } from '@vritti/quantum-ui/types/utility';
import { forwardRef } from 'react';

// The supplier whose enrollments list the sites, or an inventory item to list the sites any of its suppliers is
// enrolled at
type EnrollmentOwner =
  | { supplierId: string; inventoryItemId?: never }
  | { inventoryItemId: string; supplierId?: never };

export type EnrolledSiteFilterProps = DistributiveOmit<SelectFilterProps, 'optionsEndpoint' | 'name'> & {
  name?: string;
} & EnrollmentOwner;

// Pre-configured SelectFilter over the sites a supplier, or any supplier of an inventory item, is enrolled at — paused
// enrollments included, since their records stay viewable
export const EnrolledSiteFilter = Object.assign(
  forwardRef<HTMLButtonElement, EnrolledSiteFilterProps>(({ supplierId, inventoryItemId, params, ...props }, ref) => (
    <SelectFilter
      ref={ref}
      name="sites"
      label="Sites"
      placeholder={props.multiple ? 'Select sites' : 'Select site'}
      optionsEndpoint="select-api/sites"
      fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'code' }}
      {...props}
      params={{
        ...params,
        ...(supplierId ? { supplierId } : {}),
        ...(inventoryItemId ? { inventoryItemId } : {}),
        isEnrolled: true,
      }}
    />
  )),
  { displayName: 'EnrolledSiteFilter', defaultLabel: 'Sites', defaultName: 'sites' },
);
