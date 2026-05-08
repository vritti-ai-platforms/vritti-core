import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemVariant, UpdateVariantData } from '@/schemas/items';
import { updateVariant } from '@/services/items.service';
import { ITEM_KEY } from './keys';

type UpdateVariantVariables = { itemId: string; variantId: string; data: UpdateVariantData };

// Updates a single variant and invalidates item detail
export function useUpdateVariant(
  options?: Omit<UseMutationOptions<ItemVariant, AxiosError, UpdateVariantVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemVariant, AxiosError, UpdateVariantVariables>({
    ...options,
    mutationFn: updateVariant,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ITEM_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
