import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateVariantData, OfferingVariantData } from '@/schemas/offerings';
import { createVariant } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useCreateOfferingVariant(
  options?: Omit<UseMutationOptions<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantData>({
    ...options,
    mutationFn: createVariant,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
