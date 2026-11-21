import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemCounts } from '@/schemas/suppliers';
import { getSupplierItemCounts } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEM_COUNTS_KEY } from './keys';

// Fetches how many sites and prices a supplier item has, one per tab; under the item's key, so whatever refreshes the
// item refreshes them
export function useSupplierItemCounts(supplierId: string, itemId: string) {
  return useQuery<SupplierItemCounts, AxiosError>({
    queryKey: SUPPLIER_ITEM_COUNTS_KEY(supplierId, itemId),
    queryFn: () => getSupplierItemCounts({ supplierId, itemId }),
  });
}
