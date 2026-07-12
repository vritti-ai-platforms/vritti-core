import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteModifierGroup } from '@/site/services/modifier-groups.service';
import { MODIFIER_GROUPS_KEY } from './keys';

interface DeleteModifierGroupParams {
  catalogId: string;
  groupId: string;
}

// Deletes a modifier group and invalidates the list
export function useDeleteModifierGroup(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteModifierGroupParams>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, DeleteModifierGroupParams>({
    ...options,
    mutationFn: deleteModifierGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: MODIFIER_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
