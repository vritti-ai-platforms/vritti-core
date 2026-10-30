import { SelectFilter, type SelectFilterProps } from '@vritti/quantum-ui/Select';
import { forwardRef, useMemo } from 'react';
import { useSupplierSitesTable } from '@/hooks/legal-entity/suppliers';

export type SupplierSiteFilterProps = Omit<SelectFilterProps, 'options' | 'name'> & {
  name?: string;
  supplierId: string;
};

// Pre-configured SelectFilter over the sites a supplier is enrolled at
export const SupplierSiteFilter = Object.assign(
  forwardRef<HTMLButtonElement, SupplierSiteFilterProps>(({ supplierId, ...props }, ref) => {
    const { data } = useSupplierSitesTable(supplierId);
    const options = useMemo(
      () =>
        (data?.result ?? [])
          .filter((site) => site.enrollmentStatus === 'ENROLLED')
          .map((site) => ({
            value: site.siteId,
            label: site.siteName ?? site.siteId,
            description: site.siteCode ?? undefined,
          })),
      [data],
    );
    return (
      <SelectFilter
        ref={ref}
        name="sites"
        label="Sites"
        placeholder="Select sites"
        multiple
        options={options}
        {...props}
      />
    );
  }),
  { displayName: 'SupplierSiteFilter', defaultLabel: 'Sites', defaultName: 'sites' },
);
