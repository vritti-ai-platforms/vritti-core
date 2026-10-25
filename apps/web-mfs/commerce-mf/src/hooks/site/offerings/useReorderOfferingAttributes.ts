import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ReorderAttributesData } from '@/schemas/offerings';
import { reorderAttributes } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useReorderAttributes(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderAttributesData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, ReorderAttributesData>({
    ...options,
    mutationFn: reorderAttributes,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
