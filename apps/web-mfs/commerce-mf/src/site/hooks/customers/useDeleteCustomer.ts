import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteCustomer } from '@/site/services/customers.service';
import { CUSTOMERS_TABLE_KEY } from './keys';

// Deletes a customer and invalidates the table
export function useDeleteCustomer(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCustomer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
