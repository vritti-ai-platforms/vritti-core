import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupData } from '@/schemas/offerings';
import { type CreateModifierGroupPayload, createModifierGroup } from '@/services/site/modifier-groups.service';
import { MODIFIER_GROUPS_KEY } from './keys';

// Creates a modifier group and invalidates the list
export function useCreateModifierGroup(
  options?: Omit<UseMutationOptions<ModifierGroupData, AxiosError, CreateModifierGroupPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ModifierGroupData, AxiosError, CreateModifierGroupPayload>({
    ...options,
    mutationFn: createModifierGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
