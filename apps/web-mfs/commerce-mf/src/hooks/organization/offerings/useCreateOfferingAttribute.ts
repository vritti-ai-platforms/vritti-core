import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateAttributeData, OfferingAttributeData } from '@/schemas/offerings';
import { createAttribute } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useCreateOfferingAttribute(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeData>({
    ...options,
    mutationFn: createAttribute,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
