import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemQuantData } from '@/schemas/inventory-item-quants';
import { getInventoryItemQuant } from '@/services/site/inventory-item-quants.service';
import { INVENTORY_ITEM_QUANT_KEY } from './keys';

export function useInventoryItemQuant(
  id: string | null,
  options?: Omit<UseQueryOptions<InventoryItemQuantData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemQuantData, AxiosError>({
    queryKey: [...INVENTORY_ITEM_QUANT_KEY(id ?? '')],
    queryFn: () => getInventoryItemQuant(id as string),
    enabled: !!id,
    ...options,
  });
}
