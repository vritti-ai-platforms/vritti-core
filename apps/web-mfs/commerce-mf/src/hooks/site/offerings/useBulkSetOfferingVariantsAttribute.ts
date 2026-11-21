import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { BulkSetVariantsAttributeData } from '@/schemas/offerings';
import { bulkSetVariantsAttribute } from '@/services/site/offerings.service';

// One attribute across the whole selection.
export function useBulkSetOfferingVariantsAttribute(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetVariantsAttributeData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, BulkSetVariantsAttributeData>({
    ...options,
    mutationFn: bulkSetVariantsAttribute,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariantAttributeValues, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
