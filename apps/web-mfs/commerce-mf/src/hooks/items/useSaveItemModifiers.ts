import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemModifierGroup } from '@/schemas/items';
import { saveItemModifiers } from '@/services/items.service';
import { ITEM_KEY } from './keys';

type SaveModifiersVariables = { itemId: string; groupIds: string[] };

// Saves modifier group assignments for an item
export function useSaveItemModifiers(
  options?: Omit<UseMutationOptions<ItemModifierGroup[], AxiosError, SaveModifiersVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemModifierGroup[], AxiosError, SaveModifiersVariables>({
    ...options,
    mutationFn: saveItemModifiers,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ITEM_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
