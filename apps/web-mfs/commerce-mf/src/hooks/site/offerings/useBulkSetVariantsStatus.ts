import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetVariantsStatus } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useBulkSetVariantsStatus(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; isActive: boolean }>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; isActive: boolean }>({
    ...options,
    mutationFn: bulkSetVariantsStatus,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
