import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';
import { getOrgInventoryItemSuppliersTable } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY } from './keys';

// Read-only suppliers for an ORG item
export function useInventoryItemSuppliersTable(inventoryItemId: string | null) {
  return useQuery<InventoryItemSuppliersTableResponse, AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId ?? ''),
    queryFn: () => getOrgInventoryItemSuppliersTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
  });
}
