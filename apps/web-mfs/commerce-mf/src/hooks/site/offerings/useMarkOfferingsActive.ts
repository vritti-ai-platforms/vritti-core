import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetOfferingsStatus } from '@/services/site/offerings.service';
import { MARK_OFFERINGS_ACTIVE_KEY } from './keys';
import { useInvalidate } from './useInvalidate';

export function useMarkOfferingsActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { ids: string[] }>, 'mutationFn' | 'mutationKey'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { ids: string[] }>({
    ...options,
    mutationKey: MARK_OFFERINGS_ACTIVE_KEY,
    mutationFn: ({ ids }) => bulkSetOfferingsStatus({ ids, isActive: true }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
