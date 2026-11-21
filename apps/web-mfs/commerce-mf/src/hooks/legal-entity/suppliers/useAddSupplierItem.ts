import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SupplierItemData } from '@/schemas/suppliers';
import { type AddSupplierItemPayload, addSupplierItem } from '@/services/legal-entity/suppliers.service';

// Adds an inventory item to a supplier and invalidates the detail
export function useAddSupplierItem(
  supplierId: string,
  options?: Omit<UseMutationOptions<SupplierItemData, AxiosError, AddSupplierItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierItemData, AxiosError, AddSupplierItemPayload>({
    ...options,
    mutationFn: (data) => addSupplierItem({ supplierId, data }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierItems, Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
