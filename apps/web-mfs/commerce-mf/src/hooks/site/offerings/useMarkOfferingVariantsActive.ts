import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetVariantsStatus } from '@/services/site/offerings.service';
import { MARK_OFFERING_VARIANTS_ACTIVE_KEY } from './keys';
import { useInvalidate } from './useInvalidate';

export function useMarkOfferingVariantsActive(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[] }>,
    'mutationFn' | 'mutationKey'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[] }>({
    ...options,
    mutationKey: MARK_OFFERING_VARIANTS_ACTIVE_KEY,
    mutationFn: ({ offeringId, ids }) => bulkSetVariantsStatus({ offeringId, ids, isActive: true }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
