import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateReorderFormData } from '@/schemas/inventory-items';
import { updateInventoryItemReorder } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEM_KEY, INVENTORY_ITEMS_TABLE_KEY } from './keys';

type Payload = UpdateReorderFormData & { inventoryItemId: string };

// Updates the reorder point for an item at the current site and invalidates table + detail
export function useUpdateReorder(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Payload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Payload>({
    ...options,
    mutationFn: updateInventoryItemReorder,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_KEY(variables.inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
