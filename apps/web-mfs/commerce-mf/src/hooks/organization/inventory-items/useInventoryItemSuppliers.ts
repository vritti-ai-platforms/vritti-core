import { useQuery } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InventoryItemSuppliersTableResponse } from '@/schemas/suppliers';
import { getOrgInventoryItemSuppliersTable } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY } from './keys';

// Read-only suppliers for an ORG item; self-gates the GET on the inventory-items view permission
export function useInventoryItemSuppliersTable(inventoryItemId: string | null) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.view);
  return useQuery<InventoryItemSuppliersTableResponse, AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId ?? ''),
    queryFn: () => getOrgInventoryItemSuppliersTable(inventoryItemId as string),
    enabled: available && !!inventoryItemId,
  });
}
