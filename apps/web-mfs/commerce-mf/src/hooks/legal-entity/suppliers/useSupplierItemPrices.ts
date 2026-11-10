import {
  keepPreviousData,
  queryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateSitePriceVars } from '@/components/suppliers/types';
import type {
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
} from '@/schemas/suppliers';
import {
  type AddSupplierItemPricePayload,
  addSupplierItemPrice,
  deleteSupplierItemPrice,
  getSupplierItemPriceHistory,
  getSupplierItemPricesTable,
  updateSupplierItemPrice,
} from '@/services/legal-entity/suppliers.service';
import {
  SUPPLIER_ITEM_KEY,
  SUPPLIER_ITEM_PRICE_HISTORY_KEY,
  SUPPLIER_ITEM_PRICES_TABLE_KEY,
  SUPPLIER_KEY,
} from './keys';

const ITEM_ID_INDEX = SUPPLIER_ITEM_KEY('', '').length - 1;

// Fetches a supplier item's price timeline at the site in the table's context; keeps the rows on screen while filters
// or context change, never another item's, and self-gates on the prices view permission
export function useSupplierItemPricesTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierItemPricesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPricesTableResponse, AxiosError>({
    queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSupplierItemPricesTable(supplierId, itemId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[ITEM_ID_INDEX] === itemId ? previous : undefined,
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

// The price history's query options — `useChart` runs them once the context bar has settled; self-gates on the price
// view permission
export function useSupplierItemPriceHistoryQuery(supplierId: string, itemId: string) {
  const { available } = usePermission(LE_SUPPLIERS.items.prices.view);
  return queryOptions<SupplierItemPriceHistory, AxiosError>({
    queryKey: SUPPLIER_ITEM_PRICE_HISTORY_KEY(supplierId, itemId),
    queryFn: () => getSupplierItemPriceHistory(supplierId, itemId),
    placeholderData: keepPreviousData,
    enabled: !!supplierId && !!itemId && available,
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

// A price change refreshes the whole supplier subtree — the item, its timelines and the enrollments' item lists
export function useUpdateSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSitePriceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSitePriceVars>({
    ...options,
    mutationFn: ({ priceId, data }) => updateSupplierItemPrice({ supplierId, itemId, priceId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (priceId) => deleteSupplierItemPrice({ supplierId, itemId, priceId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
