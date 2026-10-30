import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetSupplierActive } from '@/services/legal-entity/suppliers.service';
import { SUPPLIERS_KEY } from './keys';

export interface BulkSetSupplierActivePayload {
  ids: string[];
  isActive: boolean;
}

// Activates or deactivates several suppliers and refreshes every supplier query
export function useBulkSetSupplierActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierActivePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierActivePayload>({
    ...options,
    mutationFn: bulkSetSupplierActive,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
