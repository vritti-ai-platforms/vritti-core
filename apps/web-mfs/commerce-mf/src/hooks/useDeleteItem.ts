import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { deleteItem } from '@/services/items.service';

// Deletes an item and invalidates the items list
export function useDeleteItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      options?.onSuccess?.(...args);
    },
  });
}
