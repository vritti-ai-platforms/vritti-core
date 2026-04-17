import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getSupplierItemIds } from '@/services/suppliers.service';

export const SUPPLIER_ITEM_IDS_KEY = (supplierId: string) =>
  ['commerce', 'suppliers', supplierId, 'items', 'ids'] as const;

export function useSupplierItemIds(
  supplierId: string | null,
  options?: Omit<UseQueryOptions<string[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<string[], AxiosError>({
    queryKey: SUPPLIER_ITEM_IDS_KEY(supplierId ?? ''),
    queryFn: () => getSupplierItemIds(supplierId as string),
    enabled: !!supplierId,
    ...options,
  });
}
