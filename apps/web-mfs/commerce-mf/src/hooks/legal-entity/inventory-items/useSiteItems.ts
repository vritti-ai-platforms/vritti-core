import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  BlockSiteItemFormData,
  InventoryItemSiteData,
  ReplenishmentPayload,
  SiteItemsTableResponse,
} from '@/schemas/site-items';
import {
  addToLeSite,
  blockLeSiteItem,
  getLeSiteItemsTable,
  removeFromLeSite,
  setLeSiteItemSupplierItemsRequired,
  unblockLeSiteItem,
  updateLeSiteReplenishment,
} from '@/services/legal-entity/inventory-items.service';
import { LE_SITE_ITEMS_KEY } from './keys';

type ReplenishmentVariables = { siteId: string; data: ReplenishmentPayload };
type BlockVariables = { siteId: string; data: BlockSiteItemFormData };

// Adds the item to one of the legal entity's sites and invalidates the sites table
export function useAddToLeSite(
  inventoryItemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<InventoryItemSiteData>, AxiosError, ReplenishmentVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<InventoryItemSiteData>, AxiosError, ReplenishmentVariables>({
    ...options,
    mutationFn: ({ siteId, data }) => addToLeSite(inventoryItemId, siteId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Changes how one of the legal entity's sites replenishes the item and invalidates the sites table
export function useUpdateLeSiteReplenishment(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReplenishmentVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ReplenishmentVariables>({
    ...options,
    mutationFn: ({ siteId, data }) => updateLeSiteReplenishment(inventoryItemId, siteId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Stops one of the legal entity's sites buying the item and invalidates the sites table
export function useBlockLeSiteItem(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BlockVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, BlockVariables>({
    ...options,
    mutationFn: ({ siteId, data }) => blockLeSiteItem(inventoryItemId, siteId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Lets one of the legal entity's sites buy the item again and invalidates the sites table
export function useUnblockLeSiteItem(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (siteId) => unblockLeSiteItem(inventoryItemId, siteId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Ties buying the item at one of the legal entity's sites to the supplier's item set up there, or frees it, and refreshes
// the sites table
export function useSetLeSiteItemSupplierItemsRequired(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { siteId: string; required: boolean }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { siteId: string; required: boolean }>({
    ...options,
    mutationFn: ({ siteId, required }) => setLeSiteItemSupplierItemsRequired(inventoryItemId, siteId, required),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// The legal entity's sites with how each carries the item and the stock it holds, for the data table; self-gates on
// the sites view permission
export function useSiteItemsTable(inventoryItemId: string) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.sites.view);
  return useQuery<SiteItemsTableResponse, AxiosError>({
    queryKey: LE_SITE_ITEMS_KEY(inventoryItemId),
    queryFn: () => getLeSiteItemsTable(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

// Removes the item from one of the legal entity's sites and invalidates the sites table
export function useRemoveFromLeSite(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (siteId) => removeFromLeSite(inventoryItemId, siteId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
