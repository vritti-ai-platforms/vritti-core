import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deletePosTerminal } from '@/services/pos-terminals.service';
import { POS_TERMINALS_KEY } from './keys';

export function useDeletePosTerminal(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePosTerminal,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: POS_TERMINALS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
