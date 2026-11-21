import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierCounts } from '@/schemas/suppliers';
import { getSupplierCounts } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_COUNTS_KEY } from './keys';

// Fetches how many items, site enrollments, quotations and people a supplier has, one per tab; under the supplier's
// key, so whatever refreshes the supplier refreshes them
export function useSupplierCounts(id: string) {
  return useQuery<SupplierCounts, AxiosError>({
    queryKey: SUPPLIER_COUNTS_KEY(id),
    queryFn: () => getSupplierCounts(id),
  });
}
