import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemDetail, SaveOptionsPayload } from '@/schemas/items';
import { saveItemOptions } from '@/services/items.service';

type SaveOptionsVariables = { id: string; data: SaveOptionsPayload };

// Saves item options and invalidates item detail
export function useSaveItemOptions(
  options?: Omit<UseMutationOptions<ItemDetail, AxiosError, SaveOptionsVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemDetail, AxiosError, SaveOptionsVariables>({
    ...options,
    mutationFn: saveItemOptions,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['item'] });
      options?.onSuccess?.(...args);
    },
  });
}
