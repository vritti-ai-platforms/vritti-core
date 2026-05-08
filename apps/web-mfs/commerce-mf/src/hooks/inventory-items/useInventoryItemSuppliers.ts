import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getInventoryItemSuppliersTable } from '@/services/inventory-items.service';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';
import { INVENTORY_ITEM_SUPPLIERS_TABLE_KEY } from './keys';

export function useInventoryItemSuppliersTable(itemId: string | null) {
  return useQuery<InventoryItemSuppliersTableResponse, AxiosError>({
    queryKey: INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(itemId ?? ''),
    queryFn: () => getInventoryItemSuppliersTable(itemId as string),
    enabled: !!itemId,
  });
}
