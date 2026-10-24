import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetVariantFulfilmentData } from '@/schemas/offerings';
import { setVariantFulfilment } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useSetVariantFulfilment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetVariantFulfilmentData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetVariantFulfilmentData>({
    ...options,
    mutationFn: setVariantFulfilment,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
