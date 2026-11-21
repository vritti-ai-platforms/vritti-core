import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { BlockSiteItemFormData, InventoryItemSiteData, ReplenishmentPayload } from '@/schemas/site-items';
import {
  addToSite,
  blockSiteItem,
  bulkAddToSite,
  bulkBlockSiteItems,
  bulkUnblockSiteItems,
  getSiteItem,
  removeFromSite,
  unblockSiteItem,
  updateReplenishment,
} from '@/services/site/inventory-items.service';
import { INVENTORY_ITEM_SETUP_KEY } from './keys';

type ReplenishmentVariables = { inventoryItemId: string; data: ReplenishmentPayload };
type BlockVariables = { inventoryItemId: string; data: BlockSiteItemFormData };
type BulkBlockVariables = { inventoryItemIds: string[]; data: BlockSiteItemFormData };

// Adds an item to the current site and invalidates the table and how the site carries it
export function useAddToSite(
  options?: Omit<
    UseMutationOptions<CreateResponse<InventoryItemSiteData>, AxiosError, ReplenishmentVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<InventoryItemSiteData>, AxiosError, ReplenishmentVariables>({
    ...options,
    mutationFn: ({ inventoryItemId, data }) => addToSite(inventoryItemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Adds the selected items the current site does not carry yet and invalidates the table and how the site carries them
export function useBulkAddToSite(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string[]>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string[]>({
    ...options,
    mutationFn: bulkAddToSite,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Changes how the current site replenishes an item and invalidates the table and how the site carries it
export function useUpdateReplenishment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReplenishmentVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, ReplenishmentVariables>({
    ...options,
    mutationFn: ({ inventoryItemId, data }) => updateReplenishment(inventoryItemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Stops the current site buying an item and invalidates the table and how the site carries it
export function useBlockSiteItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BlockVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BlockVariables>({
    ...options,
    mutationFn: ({ inventoryItemId, data }) => blockSiteItem(inventoryItemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Stops the current site buying the selected items and invalidates the table and how the site carries them
export function useBulkBlockSiteItems(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkBlockVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkBlockVariables>({
    ...options,
    mutationFn: ({ inventoryItemIds, data }) => bulkBlockSiteItems(inventoryItemIds, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Lets the current site buy an item again and invalidates the table and how the site carries it
export function useUnblockSiteItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: unblockSiteItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Lets the current site buy the selected items again and invalidates the table and how the site carries them
export function useBulkUnblockSiteItems(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string[]>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string[]>({
    ...options,
    mutationFn: bulkUnblockSiteItems,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}

// Fetches how the current site carries an item, null while it does not; self-gates on the site setup view
export function useSiteItem(
  inventoryItemId: string,
  options?: Omit<UseQueryOptions<InventoryItemSiteData | null, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.setup.view);
  return useQuery<InventoryItemSiteData | null, AxiosError>({
    queryKey: INVENTORY_ITEM_SETUP_KEY(inventoryItemId),
    queryFn: () => getSiteItem(inventoryItemId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

// Removes an item from the current site and invalidates the table and how the site carries it
export function useRemoveFromSite(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, void>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, void>({
    ...options,
    mutationFn: () => removeFromSite(inventoryItemId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemSites]);
      options?.onSuccess?.(...args);
    },
  });
}
