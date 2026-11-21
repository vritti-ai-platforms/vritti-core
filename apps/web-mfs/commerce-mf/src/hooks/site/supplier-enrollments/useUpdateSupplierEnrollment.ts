import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateSupplierEnrollmentVars } from '@/schemas/supplier-enrollments';
import { updateSupplierEnrollment } from '@/services/site/suppliers.service';

// Updates a supplier's enrollment at the session site and refreshes the site's suppliers
export function useUpdateSupplierEnrollment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierEnrollmentVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierEnrollmentVars>({
    ...options,
    mutationFn: updateSupplierEnrollment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierEnrollments]);
      options?.onSuccess?.(...args);
    },
  });
}
