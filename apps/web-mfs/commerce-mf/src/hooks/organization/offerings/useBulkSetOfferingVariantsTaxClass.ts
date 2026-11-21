import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetVariantsTaxClass } from '@/services/organization/offerings.service';

export function useBulkSetOfferingVariantsTaxClass(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; taxClassId: string }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; taxClassId: string }>({
    ...options,
    mutationFn: bulkSetVariantsTaxClass,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
