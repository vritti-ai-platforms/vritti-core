import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierDetail } from '@/schemas/suppliers';
import { getSupplier } from '@/services/suppliers.service';

// Fetches supplier detail with linked items
export function useSupplier(
  id: string | null,
  options?: Omit<UseQueryOptions<SupplierDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<SupplierDetail, AxiosError>({
    queryKey: ['commerce', 'suppliers', id],
    queryFn: () => getSupplier(id as string),
    enabled: !!id,
    ...options,
  });
}
