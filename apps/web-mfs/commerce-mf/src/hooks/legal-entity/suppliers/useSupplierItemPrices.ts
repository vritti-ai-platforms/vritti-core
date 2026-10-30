import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type {
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
} from '@/schemas/suppliers';
import {
  type AddSupplierItemPricePayload,
  addSupplierItemPrice,
  getSupplierItemPriceHistory,
  getSupplierItemPricesTable,
} from '@/services/legal-entity/suppliers.service';
import type { PriceRange } from '@/utils/supplierPrice';
import { SUPPLIER_ITEM_KEY, SUPPLIER_ITEM_PRICE_HISTORY_KEY, SUPPLIER_ITEM_PRICES_TABLE_KEY } from './keys';

// Fetches a supplier item's price timeline; self-gates on the prices view permission
export function useSupplierItemPricesTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierItemPricesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPricesTableResponse, AxiosError>({
    queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSupplierItemPricesTable({ supplierId, itemId }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

// Fetches every price window of a supplier item grouped by site; self-gates on the prices view permission
export function useSupplierItemPriceHistory(
  supplierId: string,
  itemId: string,
  range: PriceRange,
  options?: Omit<UseQueryOptions<SupplierItemPriceHistory, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPriceHistory, AxiosError>({
    queryKey: [...SUPPLIER_ITEM_PRICE_HISTORY_KEY(supplierId, itemId), range.from, range.to],
    queryFn: () => getSupplierItemPriceHistory({ supplierId, itemId, range }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

export function useAddSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SupplierItemPriceRow[], AxiosError, AddSupplierItemPricePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierItemPriceRow[], AxiosError, AddSupplierItemPricePayload>({
    ...options,
    mutationFn: (data) => addSupplierItemPrice({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
