import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePosTerminalData } from '@/schemas/pos-terminals';
import { updatePosTerminal } from '@/services/site/pos-terminals.service';

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
      invalidateWrites(queryClient, [Tables.posTerminals]);
      options?.onSuccess?.(...args);
    },
  });
}
