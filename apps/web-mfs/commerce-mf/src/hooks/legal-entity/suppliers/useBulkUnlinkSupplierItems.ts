import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkUnlinkSupplierItems } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEM_IDS_KEY, SUPPLIER_ITEMS_TABLE_KEY, SUPPLIER_KEY } from './keys';

export function useBulkUnlinkSupplierItems(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string[]>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string[]>({
    ...options,
    mutationFn: (supplierItemIds) => bulkUnlinkSupplierItems({ supplierId, supplierItemIds }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_IDS_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
