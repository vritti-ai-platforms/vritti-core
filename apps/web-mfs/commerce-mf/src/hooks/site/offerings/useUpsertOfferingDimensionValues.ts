import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpsertDimensionValuesData } from '@/schemas/offerings';
import { upsertDimensionValues } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpsertOfferingDimensionValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertDimensionValuesData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpsertDimensionValuesData>({
    ...options,
    mutationFn: upsertDimensionValues,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
