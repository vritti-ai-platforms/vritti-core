import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateSupplierEnrollmentPayload, SupplierEnrollment } from '@/schemas/supplier-enrollments';
import { createSupplierEnrollment } from '@/services/site/suppliers.service';

// Enrolls a supplier at the session site and refreshes the site's suppliers
export function useCreateSupplierEnrollment(
  options?: Omit<UseMutationOptions<SupplierEnrollment, AxiosError, CreateSupplierEnrollmentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierEnrollment, AxiosError, CreateSupplierEnrollmentPayload>({
    ...options,
    mutationFn: createSupplierEnrollment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierEnrollments]);
      options?.onSuccess?.(...args);
    },
  });
}
