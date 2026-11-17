import { skipToken, useQuery } from '@tanstack/react-query';
import { LE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseOrderItemDefaults } from '@/schemas/purchase-orders';
import { getPurchaseOrderItemDefaults } from '@/services/legal-entity/purchase-orders.service';
import { PURCHASE_ORDER_ITEM_DEFAULTS_KEY } from './keys';

// Fetches what a new line of an item starts with once the item is picked; self-gates on the edit permission
export function usePurchaseOrderItemDefaults(
  id: string,
  inventoryItemId: string | undefined,
  uomId: string | undefined,
) {
  const { available } = usePermission(LE_PURCHASE_ORDERS.edit);
  return useQuery<PurchaseOrderItemDefaults, AxiosError>({
    queryKey: PURCHASE_ORDER_ITEM_DEFAULTS_KEY(id, inventoryItemId, uomId),
    queryFn: inventoryItemId ? () => getPurchaseOrderItemDefaults(id, inventoryItemId, uomId) : skipToken,
    enabled: available,
  });
}
