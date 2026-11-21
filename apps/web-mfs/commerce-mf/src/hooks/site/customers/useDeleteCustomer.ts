import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteCustomer } from '@/services/site/customers.service';

// Deletes a customer and invalidates the table
export function useDeleteCustomer(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCustomer,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.customers]);
      options?.onSuccess?.(...args);
    },
  });
}
