import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetOfferingTaxClassData } from '@/schemas/offerings';
import { setOfferingTaxClass } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useSetOfferingTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetOfferingTaxClassData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetOfferingTaxClassData>({
    ...options,
    mutationFn: setOfferingTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
