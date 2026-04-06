import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemData } from '@/schemas/items';
import { type CreateItemPayload, createItem } from '@/services/items.service';
import { ITEMS_TABLE_KEY } from './useItemsTable';

// Creates a new item and invalidates the items table
export function useCreateItem(
  options?: Omit<UseMutationOptions<ItemData, AxiosError, CreateItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemData, AxiosError, CreateItemPayload>({
    ...options,
    mutationFn: createItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
