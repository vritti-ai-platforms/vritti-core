import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CustomerData } from '@/schemas/customers';
import { type CreateCustomerPayload, createCustomer } from '@/site/services/customers.service';
import { CUSTOMERS_TABLE_KEY } from './keys';

// Creates a new customer and invalidates the table
export function useCreateCustomer(
  options?: Omit<UseMutationOptions<CustomerData, AxiosError, CreateCustomerPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CustomerData, AxiosError, CreateCustomerPayload>({
    ...options,
    mutationFn: createCustomer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
