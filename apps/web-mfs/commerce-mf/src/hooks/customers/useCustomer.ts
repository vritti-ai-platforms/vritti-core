import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CustomerDetail } from '@/schemas/customers';
import { getCustomer } from '@/services/customers.service';
import { CUSTOMER_KEY } from './keys';

// Fetches customer detail by ID
export function useCustomer(id: string) {
  return useSuspenseQuery<CustomerDetail, AxiosError>({
    queryKey: CUSTOMER_KEY(id),
    queryFn: () => getCustomer(id),
  });
}
