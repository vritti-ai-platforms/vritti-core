import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { updateVariant } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpdateOfferingVariant(
  options?: Omit<
    UseMutationOptions<
      SuccessResponse,
      AxiosError,
      { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
    >,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<
    SuccessResponse,
    AxiosError,
    { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
  >({
    ...options,
    mutationFn: updateVariant,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
