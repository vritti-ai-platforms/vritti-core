import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
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
  itemId: string | null,
  options?: Omit<
    UseQueryOptions<InventoryItemUomConversionsTableResponse, AxiosError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery<InventoryItemUomConversionsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_UOM_CONVERSIONS_KEY(itemId ?? '')],
    queryFn: () => getInventoryItemUomConversionsTable(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}

type CreatePayload = { uomId: string; primaryUomQty: number; uomQty: number };
type UpdatePayload = { conversionId: string; primaryUomQty: number; uomQty: number };

export function useCreateInventoryItemUomConversion(
  itemId: string,
  options?: UseMutationOptions<CreateResponse<InventoryItemUomConversionData>, AxiosError, CreatePayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<InventoryItemUomConversionData>, AxiosError, CreatePayload>({
    mutationFn: (data) => createInventoryItemUomConversion(itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_UOM_CONVERSIONS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateInventoryItemUomConversion(
  itemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, UpdatePayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePayload>({
    mutationFn: ({ conversionId, primaryUomQty, uomQty }) =>
      updateInventoryItemUomConversion(itemId, conversionId, { primaryUomQty, uomQty }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_UOM_CONVERSIONS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteInventoryItemUomConversion(
  itemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (conversionId) => deleteInventoryItemUomConversion(itemId, conversionId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_UOM_CONVERSIONS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
