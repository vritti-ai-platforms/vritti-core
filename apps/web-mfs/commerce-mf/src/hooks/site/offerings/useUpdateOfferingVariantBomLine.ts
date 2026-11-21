import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateBomLineData } from '@/schemas/offerings';
import { updateBomLine } from '@/services/site/offerings.service';

export function useUpdateOfferingVariantBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateBomLineData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateBomLineData>({
    ...options,
    mutationFn: updateBomLine,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringBom]);
      options?.onSuccess?.(...args);
    },
  });
}
