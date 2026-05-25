import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';
import { getInventoryItemSuppliersTable } from '@/services/inventory-items.service';
import { INVENTORY_ITEM_SUPPLIERS_TABLE_KEY } from './keys';

export function useInventoryItemSuppliersTable(inventoryItemId: string | null) {
  return useQuery<InventoryItemSuppliersTableResponse, AxiosError>({
    queryKey: INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId ?? ''),
    queryFn: () => getInventoryItemSuppliersTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
  });
}
