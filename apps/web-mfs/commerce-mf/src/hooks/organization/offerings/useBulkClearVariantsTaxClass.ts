import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkClearVariantsTaxClass } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useBulkClearVariantsTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { offeringId: string; ids: string[] }>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; ids: string[] }>({
    ...options,
    mutationFn: bulkClearVariantsTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
