import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemsTableResponse } from '@/schemas/items';
import { getItemsTable } from '@/services/items.service';

export const ITEMS_TABLE_KEY = ['commerce', 'items', 'table'] as const;

// Fetches items table data for a business unit
export function useItemsTable(
  buId: string | null,
  options?: Omit<UseQueryOptions<ItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemsTableResponse, AxiosError>({
    queryKey: [...ITEMS_TABLE_KEY, buId],
    queryFn: () => getItemsTable(buId as string),
    enabled: !!buId,
    ...options,
  });
}
