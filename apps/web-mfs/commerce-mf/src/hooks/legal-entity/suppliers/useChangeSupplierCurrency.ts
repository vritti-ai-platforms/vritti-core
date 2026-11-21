import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { type ChangeSupplierCurrencyPayload, changeSupplierCurrency } from '@/services/legal-entity/suppliers.service';

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
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
