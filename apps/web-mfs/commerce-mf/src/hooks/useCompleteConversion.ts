import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { completeConversion } from '@/services/conversions.service';
import { CONVERSIONS_TABLE_KEY } from './useConversionsTable';

export function useCompleteConversion(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; locationId: string }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; locationId: string }>({
    ...options,
    mutationFn: completeConversion,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: CONVERSIONS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'conversions', variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
