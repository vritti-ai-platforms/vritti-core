import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteTaxClass } from '@/services/organization/tax-classes.service';

export function useDeleteTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxClass,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClasses, Tables.taxClassGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
