import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  SiteStockLevelData,
  SiteStockLevelsPayload,
  SiteStockLevelsTableResponse,
} from '@/schemas/site-stock-levels';
import {
  createLeSiteStockLevels,
  deleteLeSiteStockLevels,
  getLeSiteStockLevelsTable,
  updateLeSiteStockLevels,
} from '@/services/legal-entity/inventory-items.service';
import { LE_SITE_STOCK_LEVELS_KEY } from './keys';

// The item's stock levels at the legal entity's sites, with the stock each holds, for the data table; self-gates on the
// site stock levels view permission
export function useSiteStockLevelsTable(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.siteStockLevels.view);
  return useQuery<SiteStockLevelsTableResponse, AxiosError>({
    queryKey: LE_SITE_STOCK_LEVELS_KEY(inventoryItemId),
    queryFn: () => getLeSiteStockLevelsTable(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

export function useCreateSiteStockLevels(
  inventoryItemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<SiteStockLevelData>, AxiosError, SiteStockLevelsPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<SiteStockLevelData>, AxiosError, SiteStockLevelsPayload>({
    ...options,
    mutationFn: ({ siteId, data }) => createLeSiteStockLevels(inventoryItemId, siteId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_STOCK_LEVELS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSiteStockLevels(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SiteStockLevelsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SiteStockLevelsPayload>({
    ...options,
    mutationFn: ({ siteId, data }) => updateLeSiteStockLevels(inventoryItemId, siteId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_STOCK_LEVELS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSiteStockLevels(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (siteId) => deleteLeSiteStockLevels(inventoryItemId, siteId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_STOCK_LEVELS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
