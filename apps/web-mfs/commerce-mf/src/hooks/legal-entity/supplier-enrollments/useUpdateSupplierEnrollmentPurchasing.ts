import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateEnrollmentPurchasingVars } from '@/schemas/supplier-enrollments';
import { updateSupplierEnrollmentPurchasing } from '@/services/legal-entity/supplier-enrollments.service';

// Updates a supplier's purchasing settings at a site and refreshes the supplier subtree
export function useUpdateSupplierEnrollmentPurchasing(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateEnrollmentPurchasingVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateEnrollmentPurchasingVars>({
    ...options,
    mutationFn: updateSupplierEnrollmentPurchasing,
    onSuccess: (result, variables, ...rest) => {
      invalidateWrites(queryClient, [Tables.supplierEnrollments]);
      options?.onSuccess?.(result, variables, ...rest);
    },
  });
}
