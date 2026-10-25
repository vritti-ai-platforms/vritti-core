import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpsertAttributeValuesData } from '@/schemas/offerings';
import { upsertAttributeValues } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpsertOfferingAttributeValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertAttributeValuesData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpsertAttributeValuesData>({
    ...options,
    mutationFn: upsertAttributeValues,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
