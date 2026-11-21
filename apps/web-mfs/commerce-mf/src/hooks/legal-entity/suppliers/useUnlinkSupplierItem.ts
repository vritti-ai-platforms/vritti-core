import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { unlinkSupplierItem } from '@/services/legal-entity/suppliers.service';

// Unlinks an inventory item from a supplier and invalidates the detail
export function useUnlinkSupplierItem(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (itemId) => unlinkSupplierItem({ supplierId, itemId }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierItems, Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
