import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemDetail } from '@/schemas/inventory-items';
import { getInventoryItem } from '@/services/inventory-items.service';

// Fetches inventory item detail with levels and ledger
export function useInventoryItem(
  id: string | null,
  options?: Omit<UseQueryOptions<InventoryItemDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemDetail, AxiosError>({
    queryKey: ['commerce', 'inventory-items', id],
    queryFn: () => getInventoryItem(id as string),
    enabled: !!id,
    ...options,
  });
}
