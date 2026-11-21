import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedVariantInventoryItem, CreateVariantInventoryItemData } from '@/schemas/offerings';
import { createInventoryItem } from '@/services/organization/offerings.service';

// Creates the variant's inventory item and links it in one call — the response names the new item
export function useCreateOfferingVariantInventoryItem(
  options?: Omit<
    UseMutationOptions<CreateResponse<CreatedVariantInventoryItem>, AxiosError, CreateVariantInventoryItemData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedVariantInventoryItem>, AxiosError, CreateVariantInventoryItemData>({
    ...options,
    mutationFn: createInventoryItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItems, Tables.offeringBom, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
