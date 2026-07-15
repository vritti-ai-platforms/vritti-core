import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { EnableInventoryItemFormData } from '@/schemas/inventory-items';
import { enableInventoryItem } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Enables a master inventory item at the current site and invalidates the table
export function useEnableInventoryItem(
  options?: Omit<
    UseMutationOptions<CreateResponse<{ id: string }>, AxiosError, EnableInventoryItemFormData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<{ id: string }>, AxiosError, EnableInventoryItemFormData>({
    ...options,
    mutationFn: enableInventoryItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
