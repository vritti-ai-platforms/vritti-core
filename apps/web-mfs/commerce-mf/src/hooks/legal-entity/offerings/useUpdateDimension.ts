import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateDimensionData } from '@/schemas/offerings';
import { updateDimension } from '@/services/legal-entity/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpdateDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateDimensionData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpdateDimensionData>({
    ...options,
    mutationFn: updateDimension,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
