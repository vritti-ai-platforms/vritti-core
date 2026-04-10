import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { StockTransferStatus } from '@/schemas/stock-transfers';
import { updateStockTransferStatus } from '@/services/stock-transfers.service';
import { STOCK_TRANSFERS_TABLE_KEY } from './useStockTransfersTable';

export function useUpdateStockTransferStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; status: StockTransferStatus }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; status: StockTransferStatus }>({
    ...options,
    mutationFn: updateStockTransferStatus,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'stock-transfers', variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
