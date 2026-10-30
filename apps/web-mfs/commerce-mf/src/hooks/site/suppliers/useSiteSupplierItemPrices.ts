import {
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
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
} from '@/schemas/suppliers';
import {
  type AddSiteSupplierItemPricePayload,
  addSiteSupplierItemPrice,
  deleteSiteSupplierItemPrice,
  getSiteSupplierItemPriceHistory,
  getSiteSupplierItemPricesTable,
  type UpdateSiteSupplierItemPricePayload,
  updateSiteSupplierItemPrice,
} from '@/services/site/suppliers.service';
import type { PriceRange } from '@/utils/supplierPrice';
import {
  SITE_SUPPLIER_ITEM_KEY,
  SITE_SUPPLIER_ITEM_PRICE_HISTORY_KEY,
  SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY,
} from './keys';

// Fetches a supplier item's price timeline for this site; self-gates on the prices view permission
export function useSiteSupplierItemPricesTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierItemPricesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPricesTableResponse, AxiosError>({
    queryKey: SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSiteSupplierItemPricesTable({ supplierId, itemId }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

// Fetches this site's price windows for a supplier item; self-gates on the prices view permission
export function useSiteSupplierItemPriceHistory(supplierId: string, itemId: string, range: PriceRange) {
  const { available } = usePermission(SITE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPriceHistory, AxiosError>({
    queryKey: [...SITE_SUPPLIER_ITEM_PRICE_HISTORY_KEY(supplierId, itemId), range.from, range.to],
    queryFn: () => getSiteSupplierItemPriceHistory({ supplierId, itemId, range }),
    enabled: !!supplierId && !!itemId && available,
  });
}

export function useAddSiteSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SupplierItemPriceRow[], AxiosError, AddSiteSupplierItemPricePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierItemPriceRow[], AxiosError, AddSiteSupplierItemPricePayload>({
    ...options,
    mutationFn: (data) => addSiteSupplierItemPrice({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSitePriceVars {
  priceId: string;
  data: UpdateSiteSupplierItemPricePayload;
}

export function useUpdateSiteSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSitePriceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSitePriceVars>({
    ...options,
    mutationFn: ({ priceId, data }) => updateSiteSupplierItemPrice({ supplierId, itemId, priceId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSiteSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (priceId) => deleteSiteSupplierItemPrice({ supplierId, itemId, priceId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
