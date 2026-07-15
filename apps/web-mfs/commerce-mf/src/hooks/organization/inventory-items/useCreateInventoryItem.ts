import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateOrgInventoryItemFormData, InventoryItemData } from '@/schemas/inventory-items';
import { createOrgInventoryItem } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Creates a new ORG inventory item and invalidates the table
export function useCreateInventoryItem(
  options?: Omit<
    UseMutationOptions<CreateResponse<InventoryItemData>, AxiosError, CreateOrgInventoryItemFormData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<InventoryItemData>, AxiosError, CreateOrgInventoryItemFormData>({
    ...options,
    mutationFn: createOrgInventoryItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
