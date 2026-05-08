import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierOptionData } from '@/schemas/items';
import { type CreateModifierOptionPayload, createModifierOption } from '@/services/modifier-groups.service';
import { MODIFIER_GROUPS_KEY } from './keys';

// Adds an option to a modifier group and invalidates the group detail
export function useCreateModifierOption(
  options?: Omit<UseMutationOptions<ModifierOptionData, AxiosError, CreateModifierOptionPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ModifierOptionData, AxiosError, CreateModifierOptionPayload>({
    ...options,
    mutationFn: createModifierOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
