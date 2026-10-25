import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { DeleteBomLineData } from '@/schemas/offerings';
import { deleteBomLine } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useDeleteBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteBomLineData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, DeleteBomLineData>({
    ...options,
    mutationFn: deleteBomLine,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
