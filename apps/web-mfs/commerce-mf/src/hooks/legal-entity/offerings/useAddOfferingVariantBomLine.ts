import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddBomLineData } from '@/schemas/offerings';
import { addBomLine } from '@/services/legal-entity/offerings.service';

export function useAddOfferingVariantBomLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddBomLineData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddBomLineData>({
    ...options,
    mutationFn: addBomLine,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringBom]);
      options?.onSuccess?.(...args);
    },
  });
}
