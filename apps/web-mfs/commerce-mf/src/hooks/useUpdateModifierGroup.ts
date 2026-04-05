import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupData } from '@/schemas/items';
import { type UpdateModifierGroupPayload, updateModifierGroup } from '@/services/modifier-groups.service';

// Updates a modifier group and invalidates relevant queries
export function useUpdateModifierGroup(
  options?: Omit<UseMutationOptions<ModifierGroupData, AxiosError, UpdateModifierGroupPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ModifierGroupData, AxiosError, UpdateModifierGroupPayload>({
    ...options,
    mutationFn: updateModifierGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['modifier-groups'] });
      options?.onSuccess?.(...args);
    },
  });
}
