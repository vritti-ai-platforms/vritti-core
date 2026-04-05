import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { type DeleteModifierOptionPayload, deleteModifierOption } from '@/services/modifier-groups.service';

// Deletes a modifier option and invalidates the group detail
export function useDeleteModifierOption(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteModifierOptionPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, DeleteModifierOptionPayload>({
    ...options,
    mutationFn: deleteModifierOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['modifier-groups'] });
      options?.onSuccess?.(...args);
    },
  });
}
