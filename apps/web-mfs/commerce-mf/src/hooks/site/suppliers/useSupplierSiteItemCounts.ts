import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemCounts } from '@/schemas/suppliers';
import { getSupplierSiteItemCounts } from '@/services/site/suppliers.service';
import { SITE_SUPPLIER_SITE_ITEM_COUNTS_KEY } from './keys';

// Fetches how many prices this site reads for a supplier item, one per tab; under the site item's key, so whatever
// refreshes the site item refreshes them
export function useSupplierSiteItemCounts(supplierId: string, itemId: string) {
  return useQuery<SupplierItemCounts, AxiosError>({
    queryKey: SITE_SUPPLIER_SITE_ITEM_COUNTS_KEY(supplierId, itemId),
    queryFn: () => getSupplierSiteItemCounts({ supplierId, itemId }),
  });
}
