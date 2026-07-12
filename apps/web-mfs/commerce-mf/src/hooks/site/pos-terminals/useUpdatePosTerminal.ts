import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePosTerminalData } from '@/schemas/pos-terminals';
import { updatePosTerminal } from '@/services/site/pos-terminals.service';
import { POS_TERMINAL_KEY, POS_TERMINALS_KEY } from './keys';

export function useUpdatePosTerminal(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdatePosTerminalData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdatePosTerminalData }>({
    ...options,
    mutationFn: updatePosTerminal,
    onSuccess: (...args) => {
      const variables = args[1];
      queryClient.invalidateQueries({ queryKey: POS_TERMINALS_KEY });
      queryClient.invalidateQueries({ queryKey: [...POS_TERMINAL_KEY, variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
