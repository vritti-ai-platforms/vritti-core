import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { SITE_SUPPLIER_COUNTS_KEY } from '@/hooks/site/suppliers/keys';
import type { SupplierEnrollmentCounts, SupplierEnrollmentKey } from '@/schemas/supplier-enrollments';
import { getSupplierEnrollmentCounts } from '@/services/site/suppliers.service';

// Fetches how many items, quotations and invoices a supplier has at the session site, one per tab; under the
// supplier's key, so whatever refreshes the supplier refreshes them
export function useSupplierEnrollmentCounts(key: SupplierEnrollmentKey) {
  return useQuery<SupplierEnrollmentCounts, AxiosError>({
    queryKey: SITE_SUPPLIER_COUNTS_KEY(key.supplierId),
    queryFn: () => getSupplierEnrollmentCounts(key),
  });
}
