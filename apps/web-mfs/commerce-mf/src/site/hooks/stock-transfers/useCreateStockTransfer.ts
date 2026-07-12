import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockTransferData } from '@/schemas/stock-transfers';
import { type CreateStockTransferPayload, createStockTransfer } from '@/site/services/stock-transfers.service';
import { STOCK_TRANSFERS_TABLE_KEY } from './keys';

export function useCreateStockTransfer(
  options?: Omit<UseMutationOptions<StockTransferData, AxiosError, CreateStockTransferPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockTransferData, AxiosError, CreateStockTransferPayload>({
    ...options,
    mutationFn: createStockTransfer,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_TRANSFERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
