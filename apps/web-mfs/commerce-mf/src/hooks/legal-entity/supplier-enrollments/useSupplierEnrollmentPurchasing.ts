import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type {
  EnrollmentPurchasing,
  LeSupplierEnrollmentDetail,
  SupplierEnrollmentKey,
} from '@/schemas/supplier-enrollments';
import { getSupplierEnrollment } from '@/services/legal-entity/supplier-enrollments.service';
import { SUPPLIER_ENROLLMENT_KEY } from './keys';

// Reads the enrollment's purchasing settings from the enrollment itself; null where the supplier is not enrolled
export function useSupplierEnrollmentPurchasing(key: SupplierEnrollmentKey) {
  return useSuspenseQuery<LeSupplierEnrollmentDetail, AxiosError, EnrollmentPurchasing | null>({
    queryKey: SUPPLIER_ENROLLMENT_KEY(key.supplierId, key.siteId),
    queryFn: () => getSupplierEnrollment(key),
    select: (enrollment) => enrollment.purchasing,
  });
}
