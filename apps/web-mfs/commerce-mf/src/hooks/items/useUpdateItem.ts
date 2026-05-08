import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemData } from '@/schemas/items';
import { type UpdateItemPayload, updateItem } from '@/services/items.service';
import { ITEM_DETAIL_KEY, ITEMS_TABLE_KEY } from './keys';

type UpdateItemVariables = { id: string; data: UpdateItemPayload };

// Updates item basic info and invalidates related queries
export function useUpdateItem(
  options?: Omit<UseMutationOptions<ItemData, AxiosError, UpdateItemVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemData, AxiosError, UpdateItemVariables>({
    ...options,
    mutationFn: updateItem,
    onSuccess: (...args) => {
      const variables = args[1];
      queryClient.invalidateQueries({ queryKey: ITEMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ITEM_DETAIL_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
