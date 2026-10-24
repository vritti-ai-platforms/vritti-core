import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setOfferingStatus } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useSetOfferingStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; isActive: boolean }>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { id: string; isActive: boolean }>({
    ...options,
    mutationFn: setOfferingStatus,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
