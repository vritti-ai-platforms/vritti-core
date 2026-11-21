import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ReorderAttributesData } from '@/schemas/offerings';
import { reorderAttributes } from '@/services/organization/offerings.service';

export function useReorderOfferingAttributes(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderAttributesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ReorderAttributesData>({
    ...options,
    mutationFn: reorderAttributes,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringAttributes, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
