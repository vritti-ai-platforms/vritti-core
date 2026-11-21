import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockTransferStatus } from '@/schemas/stock-transfers';
import { updateStockTransferStatus } from '@/services/site/stock-transfers.service';

export function useUpdateStockTransferStatus(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; status: StockTransferStatus }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; status: StockTransferStatus }>({
    ...options,
    mutationFn: updateStockTransferStatus,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.stockTransfers,
        Tables.inventoryItemQuants,
        Tables.inventoryItemLots,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
