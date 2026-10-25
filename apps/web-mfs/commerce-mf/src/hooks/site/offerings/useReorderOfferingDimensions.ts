import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ReorderDimensionsData } from '@/schemas/offerings';
import { reorderDimensions } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useReorderOfferingDimensions(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderDimensionsData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, ReorderDimensionsData>({
    ...options,
    mutationFn: reorderDimensions,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
