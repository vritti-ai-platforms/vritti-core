import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierItemData } from '@/schemas/suppliers';
import { type LinkSupplierItemPayload, linkSupplierItem } from '@/services/suppliers.service';
import { SUPPLIER_ITEM_IDS_KEY, SUPPLIER_ITEMS_TABLE_KEY, SUPPLIER_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_IDS_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
