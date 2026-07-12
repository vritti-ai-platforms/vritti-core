import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierDetail } from '@/schemas/suppliers';
import { getSupplier } from '@/site/services/suppliers.service';
import { SUPPLIER_KEY } from './keys';

// Fetches supplier detail by ID
export function useSupplier(id: string) {
  return useSuspenseQuery<SupplierDetail, AxiosError>({
    queryKey: SUPPLIER_KEY(id),
    queryFn: () => getSupplier(id),
  });
}
