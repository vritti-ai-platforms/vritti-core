import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetOfferingFulfilmentData } from '@/schemas/offerings';
import { setOfferingFulfilment } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useSetOfferingFulfilment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetOfferingFulfilmentData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetOfferingFulfilmentData>({
    ...options,
    mutationFn: setOfferingFulfilment,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
