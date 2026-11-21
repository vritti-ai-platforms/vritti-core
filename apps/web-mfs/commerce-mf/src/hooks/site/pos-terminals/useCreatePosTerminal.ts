import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatePosTerminalData, CreatePosTerminalResponse } from '@/schemas/pos-terminals';
import { createPosTerminal } from '@/services/site/pos-terminals.service';

export function useCreatePosTerminal(
  options?: Omit<UseMutationOptions<CreatePosTerminalResponse, AxiosError, CreatePosTerminalData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreatePosTerminalResponse, AxiosError, CreatePosTerminalData>({
    ...options,
    mutationFn: createPosTerminal,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.posTerminals]);
      options?.onSuccess?.(...args);
    },
  });
}
