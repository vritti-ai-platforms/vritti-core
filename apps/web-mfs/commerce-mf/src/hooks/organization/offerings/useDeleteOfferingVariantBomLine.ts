import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { DeleteBomLineData } from '@/schemas/offerings';
import { deleteBomLine } from '@/services/organization/offerings.service';

export function useDeleteOfferingVariantBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteBomLineData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, DeleteBomLineData>({
    ...options,
    mutationFn: deleteBomLine,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringBom, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
