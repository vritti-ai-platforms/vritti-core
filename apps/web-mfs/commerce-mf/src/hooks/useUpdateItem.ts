import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemData } from '@/schemas/items';
import { type UpdateItemPayload, updateItem } from '@/services/items.service';

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
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
      options?.onSuccess?.(...args);
    },
  });
}
