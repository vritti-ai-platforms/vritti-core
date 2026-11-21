import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateOrgInventoryItemPayload } from '@/schemas/inventory-items';
import { updateOrgInventoryItem } from '@/services/organization/inventory-items.service';

// Updates an ORG inventory item and invalidates table + detail
export function useUpdateInventoryItem(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateOrgInventoryItemPayload }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateOrgInventoryItemPayload }>({
    ...options,
    mutationFn: updateOrgInventoryItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItems]);
      options?.onSuccess?.(...args);
    },
  });
}
