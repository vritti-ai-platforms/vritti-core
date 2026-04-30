import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PriceListTableResponse } from '@/schemas/price-lists';
import { getPriceListsTable } from '@/services/price-lists.service';
import { PRICE_LISTS_TABLE_KEY } from './keys';

export function usePriceListsTable(
  options?: Omit<UseQueryOptions<PriceListTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PriceListTableResponse, AxiosError>({
    queryKey: PRICE_LISTS_TABLE_KEY,
    queryFn: getPriceListsTable,
    ...options,
  });
}
