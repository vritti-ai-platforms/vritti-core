import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedSupplierEnrollment, CreateSupplierEnrollmentPayload } from '@/schemas/supplier-enrollments';
import { createSupplierEnrollment } from '@/services/legal-entity/supplier-enrollments.service';

// Enrolls a supplier at a site and refreshes the supplier subtree
export function useCreateSupplierEnrollment(
  options?: Omit<
    UseMutationOptions<CreatedSupplierEnrollment, AxiosError, CreateSupplierEnrollmentPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreatedSupplierEnrollment, AxiosError, CreateSupplierEnrollmentPayload>({
    ...options,
    mutationFn: createSupplierEnrollment,
    onSuccess: (result, variables, ...rest) => {
      invalidateWrites(queryClient, [Tables.supplierEnrollments]);
      options?.onSuccess?.(result, variables, ...rest);
    },
  });
}
