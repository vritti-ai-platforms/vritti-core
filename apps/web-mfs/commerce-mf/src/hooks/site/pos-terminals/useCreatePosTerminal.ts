import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreatePosTerminalData, CreatePosTerminalResponse } from '@/schemas/pos-terminals';
import { createPosTerminal } from '@/services/site/pos-terminals.service';
import { POS_TERMINALS_KEY } from './keys';

export function useCreatePosTerminal(
  options?: Omit<UseMutationOptions<CreatePosTerminalResponse, AxiosError, CreatePosTerminalData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreatePosTerminalResponse, AxiosError, CreatePosTerminalData>({
    ...options,
    mutationFn: createPosTerminal,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: POS_TERMINALS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
