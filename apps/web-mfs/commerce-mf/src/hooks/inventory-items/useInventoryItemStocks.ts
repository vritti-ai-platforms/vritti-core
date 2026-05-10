import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemStockData } from '@/schemas/inventory-items';
import { getInventoryItemStocks } from '@/services/inventory-items.service';
import { INVENTORY_ITEM_STOCKS_KEY } from './keys';

export function useInventoryItemStocks(itemId: string | null) {
  return useQuery<InventoryItemStockData[], AxiosError>({
    queryKey: INVENTORY_ITEM_STOCKS_KEY(itemId ?? ''),
    queryFn: () => getInventoryItemStocks(itemId as string),
    enabled: !!itemId,
  });
}
