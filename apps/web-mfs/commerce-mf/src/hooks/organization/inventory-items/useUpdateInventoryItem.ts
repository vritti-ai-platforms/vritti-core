import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateOrgInventoryItemFormData } from '@/schemas/inventory-items';
import { updateOrgInventoryItem } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_KEY, ORG_INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Updates an ORG inventory item and invalidates table + detail
export function useUpdateInventoryItem(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateOrgInventoryItemFormData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateOrgInventoryItemFormData }>({
    ...options,
    mutationFn: updateOrgInventoryItem,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
