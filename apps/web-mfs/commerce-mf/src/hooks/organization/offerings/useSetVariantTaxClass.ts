import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetVariantTaxClassData } from '@/schemas/offerings';
import { setVariantTaxClass } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useSetVariantTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetVariantTaxClassData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, SetVariantTaxClassData>({
    ...options,
    mutationFn: setVariantTaxClass,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
