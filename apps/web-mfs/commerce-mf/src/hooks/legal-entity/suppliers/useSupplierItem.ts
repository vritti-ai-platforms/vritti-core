import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemDetail } from '@/schemas/suppliers';
import { getSupplierItem } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEM_KEY } from './keys';

// Fetches a single supplier item detail by ID
export function useSupplierItem(supplierId: string, itemId: string) {
  return useSuspenseQuery<SupplierItemDetail, AxiosError>({
    queryKey: SUPPLIER_ITEM_KEY(supplierId, itemId),
    queryFn: () => getSupplierItem({ supplierId, itemId }),
  });
}
