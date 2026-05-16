import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteItem } from '@/services/items.service';
import { ITEMS_TABLE_KEY } from './keys';

// Deletes an item and invalidates the items table
export function useDeleteItem(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
