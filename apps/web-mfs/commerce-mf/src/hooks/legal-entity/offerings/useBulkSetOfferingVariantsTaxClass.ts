import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetVariantsTaxClass } from '@/services/legal-entity/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useBulkSetVariantsTaxClass(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; taxClassId: string }>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[]; taxClassId: string }>({
    ...options,
    mutationFn: bulkSetVariantsTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
