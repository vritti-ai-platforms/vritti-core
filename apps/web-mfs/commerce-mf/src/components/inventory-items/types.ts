import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateVariantInventoryItemData, OfferingVariantData } from '@/schemas/offerings';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';

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
