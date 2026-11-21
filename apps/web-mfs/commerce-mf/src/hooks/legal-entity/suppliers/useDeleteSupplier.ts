import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteSupplier } from '@/services/legal-entity/suppliers.service';

// Deletes a supplier and invalidates the table
export function useDeleteSupplier(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteSupplier,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.suppliers,
        Tables.supplierEnrollments,
        Tables.supplierItems,
        Tables.supplierSiteItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
