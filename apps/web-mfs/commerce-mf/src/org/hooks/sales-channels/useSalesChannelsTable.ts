import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getSalesChannelsTable } from '@/org/services/sales-channels.service';
import type { SalesChannelsTableResponse } from '@/schemas/sales-channels';
import { SALES_CHANNELS_TABLE_KEY } from './keys';

export function useSalesChannelsTable(
  options?: Omit<UseQueryOptions<SalesChannelsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<SalesChannelsTableResponse, AxiosError>({
    queryKey: [...SALES_CHANNELS_TABLE_KEY],
    queryFn: getSalesChannelsTable,
    ...options,
  });
}
