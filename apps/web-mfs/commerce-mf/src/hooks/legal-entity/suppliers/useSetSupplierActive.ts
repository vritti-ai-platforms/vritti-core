import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setSupplierActive } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_KEY, SUPPLIERS_TABLE_KEY } from './keys';

export interface SetSupplierActivePayload {
  id: string;
  isActive: boolean;
}

// Activates or deactivates a supplier and refreshes the table and the supplier
export function useSetSupplierActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetSupplierActivePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SetSupplierActivePayload>({
    ...options,
    mutationFn: setSupplierActive,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(args[1].id) });
      options?.onSuccess?.(...args);
    },
  });
}
