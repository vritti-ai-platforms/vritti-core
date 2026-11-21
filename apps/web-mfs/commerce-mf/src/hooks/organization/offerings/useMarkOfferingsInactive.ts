import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetOfferingsStatus } from '@/services/organization/offerings.service';
import { MARK_OFFERINGS_INACTIVE_KEY } from './keys';

export function useMarkOfferingsInactive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { ids: string[] }>, 'mutationFn' | 'mutationKey'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { ids: string[] }>({
    ...options,
    mutationKey: MARK_OFFERINGS_INACTIVE_KEY,
    mutationFn: ({ ids }) => bulkSetOfferingsStatus({ ids, isActive: false }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
