import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { StockTransferStatus } from '@/schemas/stock-transfers';
import { updateStockTransferStatus } from '@/services/stock-transfers.service';
import { STOCK_TRANSFER_KEY, STOCK_TRANSFERS_TABLE_KEY } from './keys';

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
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
