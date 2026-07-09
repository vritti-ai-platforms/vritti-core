import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  InventoryItemUomConversionData,
  InventoryItemUomConversionsTableResponse,
} from '@/schemas/inventory-item-uom-conversions';
import {
  createInventoryItemUomConversion,
  deleteInventoryItemUomConversion,
  getInventoryItemUomConversionsTable,
  updateInventoryItemUomConversion,
} from '@/services/inventory-item-uom-conversions.service';
import { INVENTORY_ITEM_UOM_CONVERSIONS_KEY } from './keys';

export function useInventoryItemUomConversionsTable(
  inventoryItemId: string | null,
  options?: Omit<
    UseQueryOptions<InventoryItemUomConversionsTableResponse, AxiosError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery<InventoryItemUomConversionsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId ?? '')],
    queryFn: () => getInventoryItemUomConversionsTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
    ...options,
  });
}

type CreatePayload = { uomId: string; primaryUomQty: number; uomQty: number };
type UpdatePayload = { conversionId: string; primaryUomQty: number; uomQty: number };

export function useCreateInventoryItemUomConversion(
  inventoryItemId: string,
  options?: UseMutationOptions<CreateResponse<InventoryItemUomConversionData>, AxiosError, CreatePayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<InventoryItemUomConversionData>, AxiosError, CreatePayload>({
    mutationFn: (data) => createInventoryItemUomConversion(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateInventoryItemUomConversion(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, UpdatePayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePayload>({
    mutationFn: ({ conversionId, primaryUomQty, uomQty }) =>
      updateInventoryItemUomConversion(inventoryItemId, conversionId, { primaryUomQty, uomQty }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteInventoryItemUomConversion(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (conversionId) => deleteInventoryItemUomConversion(inventoryItemId, conversionId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
