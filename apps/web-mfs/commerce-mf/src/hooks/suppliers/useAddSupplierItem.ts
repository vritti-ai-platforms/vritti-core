import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemData } from '@/schemas/suppliers';
import { type AddSupplierItemPayload, addSupplierItem } from '@/services/suppliers.service';
import { SUPPLIER_ITEM_IDS_KEY, SUPPLIER_ITEMS_TABLE_KEY, SUPPLIER_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_IDS_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
