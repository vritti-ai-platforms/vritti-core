import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type DeleteModifierOptionPayload, deleteModifierOption } from '@/services/site/modifier-groups.service';
import { MODIFIER_GROUPS_KEY } from './keys';

// Deletes a modifier option and invalidates the group detail
export function useDeleteModifierOption(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteModifierOptionPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, DeleteModifierOptionPayload>({
    ...options,
    mutationFn: deleteModifierOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
