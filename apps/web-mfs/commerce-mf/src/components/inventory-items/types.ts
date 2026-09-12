import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateVariantInventoryItemData, OfferingVariantData } from '@/schemas/offerings';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';

// Described structurally rather than as `typeof ORG_INVENTORY_ITEMS`, so this folder carries no scope
// bias — each scope's page passes its own permission codes and its own hooks.
export type UseInventoryItemSuppliersTable = (inventoryItemId: string) => {
  data: InventoryItemSuppliersTableResponse | undefined;
  isLoading: boolean;
};

type MutationHook<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UseCreateVariantInventoryItem = MutationHook<
  CreateResponse<OfferingVariantData>,
  CreateVariantInventoryItemData
>;
