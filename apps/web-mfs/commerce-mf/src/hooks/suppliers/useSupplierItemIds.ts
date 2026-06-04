import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getSupplierItemIds } from '@/services/suppliers.service';
import { SUPPLIER_ITEM_IDS_KEY } from './keys';

export function useSupplierInventoryItemIds(
  supplierId: string,
  options?: Omit<UseQueryOptions<string[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<string[], AxiosError>({
    queryKey: SUPPLIER_ITEM_IDS_KEY(supplierId),
    queryFn: () => getSupplierItemIds(supplierId),
    ...options,
  });
}
