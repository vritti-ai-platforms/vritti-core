import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupData } from '@/schemas/offerings';
import { type UpdateModifierGroupPayload, updateModifierGroup } from '@/site/services/modifier-groups.service';
import { MODIFIER_GROUPS_KEY } from './keys';

// Updates a modifier group and invalidates relevant queries
export function useUpdateModifierGroup(
  options?: Omit<UseMutationOptions<ModifierGroupData, AxiosError, UpdateModifierGroupPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ModifierGroupData, AxiosError, UpdateModifierGroupPayload>({
    ...options,
    mutationFn: updateModifierGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
