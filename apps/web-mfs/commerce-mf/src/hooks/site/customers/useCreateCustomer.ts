import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CustomerData } from '@/schemas/customers';
import { type CreateCustomerPayload, createCustomer } from '@/services/site/customers.service';

// Creates a new customer and invalidates the table
export function useCreateCustomer(
  options?: Omit<UseMutationOptions<CustomerData, AxiosError, CreateCustomerPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CustomerData, AxiosError, CreateCustomerPayload>({
    ...options,
    mutationFn: createCustomer,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.customers]);
      options?.onSuccess?.(...args);
    },
  });
}
