import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SupplierEnrollmentKey } from '@/schemas/supplier-enrollments';
import { deleteSupplierEnrollment } from '@/services/legal-entity/supplier-enrollments.service';

// Removes a supplier's enrollment at a site and refreshes the supplier subtree
export function useDeleteSupplierEnrollment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SupplierEnrollmentKey>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SupplierEnrollmentKey>({
    ...options,
    mutationFn: deleteSupplierEnrollment,
    onSuccess: (result, variables, ...rest) => {
      invalidateWrites(queryClient, [Tables.supplierEnrollments]);
      options?.onSuccess?.(result, variables, ...rest);
    },
  });
}
