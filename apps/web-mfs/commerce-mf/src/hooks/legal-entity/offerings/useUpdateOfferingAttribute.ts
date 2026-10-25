import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateAttributeData } from '@/schemas/offerings';
import { updateAttribute } from '@/services/legal-entity/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpdateOfferingAttribute(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateAttributeData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpdateAttributeData>({
    ...options,
    mutationFn: updateAttribute,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
