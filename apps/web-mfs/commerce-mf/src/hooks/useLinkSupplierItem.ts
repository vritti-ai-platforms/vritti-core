import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemData } from '@/schemas/suppliers';
import { type LinkSupplierItemPayload, linkSupplierItem } from '@/services/suppliers.service';

// Links an inventory item to a supplier and invalidates the detail
export function useLinkSupplierItem(
  supplierId: string,
  options?: Omit<UseMutationOptions<SupplierItemData, AxiosError, LinkSupplierItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierItemData, AxiosError, LinkSupplierItemPayload>({
    ...options,
    mutationFn: (data) => linkSupplierItem({ supplierId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'suppliers', supplierId] });
      options?.onSuccess?.(...args);
    },
  });
}
