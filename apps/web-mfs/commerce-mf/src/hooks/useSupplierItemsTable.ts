import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemsTableResponse } from '@/schemas/suppliers';
import { getSupplierItemsTable } from '@/services/suppliers.service';

export const SUPPLIER_ITEMS_TABLE_KEY = (supplierId: string) =>
  ['commerce', 'suppliers', supplierId, 'items', 'table'] as const;

export function useSupplierItemsTable(
  supplierId: string | null,
  options?: Omit<UseQueryOptions<SupplierItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<SupplierItemsTableResponse, AxiosError>({
    queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId ?? ''),
    queryFn: () => getSupplierItemsTable(supplierId as string),
    enabled: !!supplierId,
    ...options,
  });
}
