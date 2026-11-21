import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CustomerData } from '@/schemas/customers';
import { type UpdateCustomerPayload, updateCustomer } from '@/services/site/customers.service';

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
      invalidateWrites(queryClient, [Tables.customers]);
      options?.onSuccess?.(...args);
    },
  });
}
