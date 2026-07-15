import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemsTableResponse } from '@/schemas/suppliers';
import { getSupplierItemsTable } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEMS_TABLE_KEY } from './keys';

export function useSupplierItemsTable(
  supplierId: string,
  options?: Omit<UseQueryOptions<SupplierItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<SupplierItemsTableResponse, AxiosError>({
    queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId),
    queryFn: () => getSupplierItemsTable(supplierId),
    ...options,
    enabled: !!supplierId && (options?.enabled ?? true),
  });
}
