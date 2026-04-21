import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { unlinkSupplierItem } from '@/services/suppliers.service';
import { SUPPLIER_ITEM_IDS_KEY, SUPPLIER_ITEMS_TABLE_KEY, SUPPLIER_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_IDS_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
