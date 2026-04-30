import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PriceListData } from '@/schemas/price-lists';
import { getPriceList } from '@/services/price-lists.service';
import { PRICE_LIST_KEY } from './keys';

export function usePriceList(
  id: string | null,
  options?: Omit<UseQueryOptions<PriceListData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PriceListData, AxiosError>({
    queryKey: [...PRICE_LIST_KEY, id],
    queryFn: () => getPriceList(id as string),
    enabled: !!id,
    ...options,
  });
}
