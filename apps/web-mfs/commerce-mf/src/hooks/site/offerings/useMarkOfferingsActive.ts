import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetOfferingsStatus } from '@/services/site/offerings.service';
import { MARK_OFFERINGS_ACTIVE_KEY } from './keys';

export function useMarkOfferingsActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { ids: string[] }>, 'mutationFn' | 'mutationKey'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { ids: string[] }>({
    ...options,
    mutationKey: MARK_OFFERINGS_ACTIVE_KEY,
    mutationFn: ({ ids }) => bulkSetOfferingsStatus({ ids, isActive: true }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings]);
      options?.onSuccess?.(...args);
    },
  });
}
