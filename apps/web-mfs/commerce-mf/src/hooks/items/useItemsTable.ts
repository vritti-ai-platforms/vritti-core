import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemsTableResponse } from '@/schemas/items';
import { getItemsTable } from '@/services/items.service';
import { ITEMS_TABLE_BY_BU_KEY } from './keys';

// Fetches items table data for a business unit
export function useItemsTable(
  buId: string | null,
  options?: Omit<UseQueryOptions<ItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemsTableResponse, AxiosError>({
    queryKey: ITEMS_TABLE_BY_BU_KEY(buId ?? ''),
    queryFn: () => getItemsTable(buId as string),
    enabled: !!buId,
    ...options,
  });
}
