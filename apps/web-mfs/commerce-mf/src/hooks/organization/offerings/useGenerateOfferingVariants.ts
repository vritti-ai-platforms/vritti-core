import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { GenerateVariantsData } from '@/schemas/offerings';
import { generateVariants } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useGenerateVariants(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, GenerateVariantsData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, GenerateVariantsData>({
    ...options,
    mutationFn: generateVariants,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
