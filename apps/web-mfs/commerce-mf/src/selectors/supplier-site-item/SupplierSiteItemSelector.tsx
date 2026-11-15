import { Select, type SelectProps } from '@vritti/quantum-ui/Select';
import { forwardRef, useMemo } from 'react';
import { useSupplierSiteItemsTable } from '@/hooks/legal-entity/suppliers';

export type SupplierSiteItemSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'options'> & {
  supplierId: string;
  itemId: string;
};

// Pre-configured Select over the sites a supplier item is set up at (single or multi-select)
export const SupplierSiteItemSelector = forwardRef<HTMLButtonElement, SupplierSiteItemSelectorProps>(
  ({ supplierId, itemId, ...props }, ref) => {
    const { data } = useSupplierSiteItemsTable(supplierId, itemId);
    const options = useMemo(
      () =>
        (data?.result ?? []).map((site) => ({
          value: site.siteId,
          label: site.siteName,
          description: site.siteCode,
        })),
      [data],
    );
    return <Select ref={ref} label="Sites" placeholder="Select sites" searchable {...props} options={options} />;
  },
);
SupplierSiteItemSelector.displayName = 'SupplierSiteItemSelector';
