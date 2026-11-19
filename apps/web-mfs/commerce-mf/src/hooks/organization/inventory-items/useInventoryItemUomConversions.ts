import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CreateInventoryItemUomConversionFormData,
  InventoryItemUomConversionData,
  InventoryItemUomConversionsTableResponse,
  UpdateInventoryItemUomConversionPayload,
} from '@/schemas/inventory-item-uom-conversions';
import {
  createOrgInventoryItemUomConversion,
  deleteOrgInventoryItemUomConversion,
  getOrgInventoryItemUomConversionsTable,
  updateOrgInventoryItemUomConversion,
} from '@/services/organization/inventory-item-uom-conversions.service';
import { ORG_INVENTORY_ITEM_UNITS_KEY, ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY } from './keys';

export function useInventoryItemUomConversionsTable(
  inventoryItemId: string | null,
  options?: Omit<
    UseQueryOptions<InventoryItemUomConversionsTableResponse, AxiosError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.conversions.view);
  return useQuery<InventoryItemUomConversionsTableResponse, AxiosError>({
    queryKey: [...ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId ?? '')],
    queryFn: () => getOrgInventoryItemUomConversionsTable(inventoryItemId as string),
    ...options,
    enabled: available && !!inventoryItemId,
  });
}

export function useCreateInventoryItemUomConversion(
  inventoryItemId: string,
  options?: UseMutationOptions<
    CreateResponse<InventoryItemUomConversionData>,
    AxiosError,
    CreateInventoryItemUomConversionFormData
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateResponse<InventoryItemUomConversionData>,
    AxiosError,
    CreateInventoryItemUomConversionFormData
  >({
    mutationFn: (data) => createOrgInventoryItemUomConversion(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_UNITS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateInventoryItemUomConversion(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, UpdateInventoryItemUomConversionPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateInventoryItemUomConversionPayload>({
    mutationFn: ({ conversionId, ...data }) => updateOrgInventoryItemUomConversion(inventoryItemId, conversionId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_UNITS_KEY(inventoryItemId) });
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
    mutationFn: (conversionId) => deleteOrgInventoryItemUomConversion(inventoryItemId, conversionId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_UNITS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
