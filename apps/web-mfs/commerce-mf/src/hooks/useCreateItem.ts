import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemData } from '@/schemas/items';
import { type CreateItemPayload, createItem } from '@/services/items.service';

// Creates a new item and invalidates the items list
export function useCreateItem(
  options?: Omit<UseMutationOptions<ItemData, AxiosError, CreateItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemData, AxiosError, CreateItemPayload>({
    ...options,
    mutationFn: createItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      options?.onSuccess?.(...args);
    },
  });
}
