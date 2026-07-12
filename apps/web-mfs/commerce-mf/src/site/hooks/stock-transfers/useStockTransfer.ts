import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockTransferData } from '@/schemas/stock-transfers';
import { getStockTransfer } from '@/site/services/stock-transfers.service';
import { STOCK_TRANSFER_KEY } from './keys';

export function useStockTransfer(
  id: string | null,
  options?: Omit<UseQueryOptions<StockTransferData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockTransferData, AxiosError>({
    queryKey: STOCK_TRANSFER_KEY(id ?? ''),
    queryFn: () => getStockTransfer(id as string),
    enabled: !!id,
    ...options,
  });
}
