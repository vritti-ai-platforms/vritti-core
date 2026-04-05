import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ModifierGroupData } from '@/schemas/items';
import { type CreateModifierGroupPayload, createModifierGroup } from '@/services/modifier-groups.service';

// Creates a modifier group and invalidates the list
export function useCreateModifierGroup(
  options?: Omit<UseMutationOptions<ModifierGroupData, AxiosError, CreateModifierGroupPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ModifierGroupData, AxiosError, CreateModifierGroupPayload>({
    ...options,
    mutationFn: createModifierGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['modifier-groups'] });
      options?.onSuccess?.(...args);
    },
  });
}
