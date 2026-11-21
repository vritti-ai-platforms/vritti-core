import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ReorderDimensionsData } from '@/schemas/offerings';
import { reorderDimensions } from '@/services/organization/offerings.service';

export function useReorderOfferingDimensions(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderDimensionsData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ReorderDimensionsData>({
    ...options,
    mutationFn: reorderDimensions,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringDimensions, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
