import {
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
import type { SupplierItemPriceRow, SupplierItemPricesTableResponse } from '@/schemas/suppliers';
import {
  type AddSupplierItemPricePayload,
  addSupplierItemPrice,
  deleteSupplierItemPrice,
  getSupplierItemPricesTable,
  type UpdateSupplierItemPricePayload,
  updateSupplierItemPrice,
} from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEM_KEY, SUPPLIER_ITEM_PRICES_TABLE_KEY } from './keys';

// Fetches a supplier item's price timeline; self-gates on the prices view permission
export function useSupplierItemPricesTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierItemPricesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.prices.view);
  return useQuery<SupplierItemPricesTableResponse, AxiosError>({
    queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSupplierItemPricesTable({ supplierId, itemId }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

export function useAddSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SupplierItemPriceRow, AxiosError, AddSupplierItemPricePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierItemPriceRow, AxiosError, AddSupplierItemPricePayload>({
    ...options,
    mutationFn: (data) => addSupplierItemPrice({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSupplierItemPriceVars {
  priceId: string;
  data: UpdateSupplierItemPricePayload;
}

export function useUpdateSupplierItemPrice(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierItemPriceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierItemPriceVars>({
    ...options,
    mutationFn: ({ priceId, data }) => updateSupplierItemPrice({ supplierId, itemId, priceId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_KEY(supplierId, itemId) });
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
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
