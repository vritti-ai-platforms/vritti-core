import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { BulkSetVariantsAttributeData } from '@/schemas/offerings';
import { bulkSetVariantsAttribute } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

// One attribute across the whole selection.
export function useBulkSetVariantsAttribute(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetVariantsAttributeData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, BulkSetVariantsAttributeData>({
    ...options,
    mutationFn: bulkSetVariantsAttribute,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
