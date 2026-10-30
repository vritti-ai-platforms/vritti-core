import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef, useMemo } from 'react';
import { useSupplierItemSitesTable } from '@/hooks/legal-entity/suppliers';

export type SupplierItemSiteSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'options'> & {
  supplierId: string;
  itemId: string;
};

// Pre-configured Select over the sites a supplier item is set up at (single or multi-select)
export const SupplierItemSiteSelector = forwardRef<HTMLButtonElement, SupplierItemSiteSelectorProps>(
  ({ supplierId, itemId, ...props }, ref) => {
    const { data } = useSupplierItemSitesTable(supplierId, itemId);
    const options = useMemo(
      () =>
        (data?.result ?? []).map((site) => ({
          value: site.siteId,
          label: site.siteName ?? site.siteId,
          description: site.siteCode ?? undefined,
        })),
      [data],
    );
    return <Select ref={ref} label="Sites" placeholder="Select sites" searchable {...props} options={options} />;
  },
);
SupplierItemSiteSelector.displayName = 'SupplierItemSiteSelector';
