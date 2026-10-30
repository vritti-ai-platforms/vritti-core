import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef, useMemo } from 'react';
import { useSupplierSitesTable } from '@/hooks/legal-entity/suppliers';

export type SupplierSiteSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'options'> & {
  supplierId: string;
  // Lists only the sites the supplier is enrolled at (default); off lists every site, marking the not-enrolled ones
  enrolledOnly?: boolean;
};

// Pre-configured Select over the legal entity's sites for a supplier (single or multi-select)
export const SupplierSiteSelector = forwardRef<HTMLButtonElement, SupplierSiteSelectorProps>(
  ({ supplierId, enrolledOnly = true, ...props }, ref) => {
    const { data } = useSupplierSitesTable(supplierId);
    const options = useMemo(
      () =>
        (data?.result ?? [])
          .filter((site) => !enrolledOnly || site.enrollmentStatus === 'ENROLLED')
          .map((site) => ({
            value: site.siteId,
            label: site.siteName ?? site.siteId,
            description:
              [site.siteCode, site.enrollmentStatus === 'ENROLLED' ? null : 'Not Enrolled']
                .filter(Boolean)
                .join(' · ') || undefined,
          })),
      [data, enrolledOnly],
    );
    return (
      <Select ref={ref} label="Sites" placeholder="Select enrolled sites" searchable {...props} options={options} />
    );
  },
);
SupplierSiteSelector.displayName = 'SupplierSiteSelector';
