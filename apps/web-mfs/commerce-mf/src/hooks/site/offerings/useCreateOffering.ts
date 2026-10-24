import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateOfferingData, OfferingData } from '@/schemas/offerings';
import { createOffering } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useCreateOffering(
  options?: Omit<UseMutationOptions<CreateResponse<OfferingData>, AxiosError, CreateOfferingData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingData>, AxiosError, CreateOfferingData>({
    ...options,
    mutationFn: createOffering,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
