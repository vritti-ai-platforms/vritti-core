import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateDimensionData } from '@/schemas/offerings';
import { updateDimension } from '@/services/legal-entity/offerings.service';

export function useUpdateOfferingDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateDimensionData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateDimensionData>({
    ...options,
    mutationFn: updateDimension,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringDimensions, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
