import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CustomerData } from '@/schemas/customers';
import { type UpdateCustomerPayload, updateCustomer } from '@/site/services/customers.service';
import { CUSTOMER_KEY, CUSTOMERS_TABLE_KEY } from './keys';

// Updates a customer and invalidates table + detail
export function useUpdateCustomer(
  options?: Omit<
    UseMutationOptions<CustomerData, AxiosError, { id: string; data: UpdateCustomerPayload }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CustomerData, AxiosError, { id: string; data: UpdateCustomerPayload }>({
    ...options,
    mutationFn: updateCustomer,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
