import {
  keepPreviousData,
  queryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddSupplierSiteItemPricePayload,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierSiteItemPricesTableResponse,
  UpdateSupplierSiteItemPricePayload,
} from '@/schemas/suppliers';
import {
  addSupplierSiteItemPrice,
  deleteSupplierSiteItemPrice,
  getSupplierSiteItemPriceHistory,
  getSupplierSiteItemPricesTable,
  updateSupplierSiteItemPrice,
} from '@/services/site/suppliers.service';
import {
  SITE_SUPPLIER_SITE_ITEM_KEY,
  SITE_SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY,
  SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY,
} from './keys';

// Fetches a supplier item's price timeline for this site; self-gates on the prices view permission
export function useSupplierSiteItemPricesTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierSiteItemPricesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_SUPPLIERS.siteItems.prices.view);
  return useQuery<SupplierSiteItemPricesTableResponse, AxiosError>({
    queryKey: SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSupplierSiteItemPricesTable({ supplierId, itemId }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

// The price history's query options — `useChart` runs them once the context bar has settled; self-gates on the price
// view permission
export function useSupplierSiteItemPriceHistoryQuery(supplierId: string, itemId: string) {
  const { available } = usePermission(SITE_SUPPLIERS.siteItems.prices.view);
  return queryOptions<SupplierItemPriceHistory, AxiosError>({
    queryKey: SITE_SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY(supplierId, itemId),
    queryFn: () => getSupplierSiteItemPriceHistory(supplierId, itemId),
    placeholderData: keepPreviousData,
    enabled: !!supplierId && !!itemId && available,
  });
}

export function useAddSupplierSiteItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SupplierItemPriceRow[], AxiosError, AddSupplierSiteItemPricePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierItemPriceRow[], AxiosError, AddSupplierSiteItemPricePayload>({
    ...options,
    mutationFn: (data) => addSupplierSiteItemPrice({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_SITE_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSitePriceVars {
  priceId: string;
  data: UpdateSupplierSiteItemPricePayload;
}

export function useUpdateSupplierSiteItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSitePriceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSitePriceVars>({
    ...options,
    mutationFn: ({ priceId, data }) => updateSupplierSiteItemPrice({ supplierId, itemId, priceId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_SITE_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSupplierSiteItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (priceId) => deleteSupplierSiteItemPrice({ supplierId, itemId, priceId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_SITE_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
