import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type ChangeSupplierCurrencyPayload, changeSupplierCurrency } from '@/services/site/suppliers.service';
import { SUPPLIER_ITEMS_TABLE_KEY, SUPPLIER_KEY, SUPPLIERS_TABLE_KEY } from './keys';

// Changes a supplier's currency and invalidates detail + items table + suppliers table
export function useChangeSupplierCurrency(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangeSupplierCurrencyPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, ChangeSupplierCurrencyPayload>({
    ...options,
    mutationFn: (data) => changeSupplierCurrency(supplierId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
