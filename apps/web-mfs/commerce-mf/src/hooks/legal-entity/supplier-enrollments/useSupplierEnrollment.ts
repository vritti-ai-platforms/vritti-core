import { useSuspenseQuery } from '@tanstack/react-query';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type { AxiosError } from 'axios';
import type { LeSupplierEnrollmentDetail, SupplierEnrollmentKey } from '@/schemas/supplier-enrollments';
import { getSupplierEnrollment } from '@/services/legal-entity/supplier-enrollments.service';
import { SUPPLIER_ENROLLMENT_KEY } from './keys';

// The supplier and site of an LE enrollment page
export function useSupplierEnrollmentRef(): SupplierEnrollmentKey {
  const { supplierSlug, siteSlug } = useSlugParams('supplierSlug', 'siteSlug');
  return { supplierId: supplierSlug.id, siteId: siteSlug.id };
}

// Fetches the supplier as one of the legal entity's sites sees it, enrolled there or not
export function useSupplierEnrollment(key: SupplierEnrollmentKey) {
  return useSuspenseQuery<LeSupplierEnrollmentDetail, AxiosError>({
    queryKey: SUPPLIER_ENROLLMENT_KEY(key.supplierId, key.siteId),
    queryFn: () => getSupplierEnrollment(key),
  });
}
