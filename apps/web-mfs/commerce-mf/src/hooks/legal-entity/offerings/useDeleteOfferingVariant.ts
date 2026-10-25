import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteVariant } from '@/services/legal-entity/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useDeleteVariant(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteVariant,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
