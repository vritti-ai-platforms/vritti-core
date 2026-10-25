import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateBomLineData } from '@/schemas/offerings';
import { updateBomLine } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useUpdateBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateBomLineData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, UpdateBomLineData>({
    ...options,
    mutationFn: updateBomLine,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
