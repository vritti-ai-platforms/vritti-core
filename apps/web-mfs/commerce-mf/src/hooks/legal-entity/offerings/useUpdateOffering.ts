import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateOfferingFormData } from '@/schemas/offerings';
import { updateOffering } from '@/services/legal-entity/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpdateOffering(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateOfferingFormData }>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateOfferingFormData }>({
    ...options,
    mutationFn: updateOffering,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
