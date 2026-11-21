import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setOfferingStatus } from '@/services/site/offerings.service';

export function useSetOfferingStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; isActive: boolean }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { id: string; isActive: boolean }>({
    ...options,
    mutationFn: setOfferingStatus,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings]);
      options?.onSuccess?.(...args);
    },
  });
}
