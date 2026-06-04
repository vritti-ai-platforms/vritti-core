import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockTransfersTableResponse } from '@/schemas/stock-transfers';
import { getStockTransfersTable } from '@/services/stock-transfers.service';
import { STOCK_TRANSFERS_TABLE_KEY } from './keys';

export function useStockTransfersTable(
  options?: Omit<UseQueryOptions<StockTransfersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<StockTransfersTableResponse, AxiosError>({
    queryKey: STOCK_TRANSFERS_TABLE_KEY,
    queryFn: getStockTransfersTable,
    ...options,
  });
}
