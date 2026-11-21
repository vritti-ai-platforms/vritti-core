import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetVariantsStatus } from '@/services/site/offerings.service';
import { MARK_OFFERING_VARIANTS_INACTIVE_KEY } from './keys';

export function useMarkOfferingVariantsInactive(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[] }>,
    'mutationFn' | 'mutationKey'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[] }>({
    ...options,
    mutationKey: MARK_OFFERING_VARIANTS_INACTIVE_KEY,
    mutationFn: ({ offeringId, ids }) => bulkSetVariantsStatus({ offeringId, ids, isActive: false }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
