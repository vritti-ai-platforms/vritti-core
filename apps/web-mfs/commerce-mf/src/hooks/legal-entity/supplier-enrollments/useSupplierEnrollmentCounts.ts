import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierEnrollmentCounts, SupplierEnrollmentKey } from '@/schemas/supplier-enrollments';
import { getSupplierEnrollmentCounts } from '@/services/legal-entity/supplier-enrollments.service';
import { SUPPLIER_ENROLLMENT_COUNTS_KEY } from './keys';

// Fetches how many items and quotations the supplier has at one of the legal entity's sites, one per tab; under the
// enrollment's key, so whatever refreshes the enrollment refreshes them
export function useSupplierEnrollmentCounts(key: SupplierEnrollmentKey) {
  return useQuery<SupplierEnrollmentCounts, AxiosError>({
    queryKey: SUPPLIER_ENROLLMENT_COUNTS_KEY(key.supplierId, key.siteId),
    queryFn: () => getSupplierEnrollmentCounts(key),
  });
}
