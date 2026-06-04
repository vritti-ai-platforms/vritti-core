import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { completeConversion } from '@/services/conversions.service';
import { CONVERSION_KEY, CONVERSIONS_TABLE_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: CONVERSION_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
