import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { unlinkSupplierItem } from '@/services/suppliers.service';

// Unlinks an inventory item from a supplier and invalidates the detail
export function useUnlinkSupplierItem(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: unlinkSupplierItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'suppliers', supplierId] });
      options?.onSuccess?.(...args);
    },
  });
}
