import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddBomLineData } from '@/schemas/offerings';
import { addBomLine } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useAddBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddBomLineData>, 'mutationFn'>,
) {
  const invalidate = useInvalidate();
  return useMutation<SuccessResponse, AxiosError, AddBomLineData>({
    ...options,
    mutationFn: addBomLine,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
