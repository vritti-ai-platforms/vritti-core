import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { type UpdateSupplierItemPayload, updateSupplierItem } from '@/services/suppliers.service';
import { SUPPLIER_ITEMS_TABLE_KEY, SUPPLIER_KEY } from './keys';

interface UpdateSupplierItemVariables {
  itemId: string;
  data: UpdateSupplierItemPayload;
}

// Updates a supplier item link and invalidates the detail
export function useUpdateSupplierItem(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierItemVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateSupplierItemVariables>({
    ...options,
    mutationFn: ({ itemId, data }) => updateSupplierItem({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
