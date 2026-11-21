import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PurchaseActionValues,
  type PurchaseDetail,
  type PurchaseItemView,
  purchaseStatusConfig,
} from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { purchasePath } from '../documentPaths';

interface PurchaseItemDangerZoneProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
}

// Removes the item from its purchase and returns to the purchase's items; blocked while the purchase is closed to item
// changes or part of the item is allocated
export const PurchaseItemDangerZone: React.FC<PurchaseItemDangerZoneProps> = ({ binding, purchase, item }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const removeMutation = binding.useRemoveItem();
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const blocker = actions
    ? removeBlocker(actions.availableActions.includes(PurchaseActionValues.EDIT_ITEMS), purchase, item)
    : null;

  return (
    <DangerZone
      title="Remove Item"
      description={`Take ${item.inventoryItemName} off "${purchase.purchaseNumber}". The inventory item itself is not deleted. Possible until part of it is allocated.`}
      buttonText="Remove Item"
      confirm={{
        title: `Remove "${item.inventoryItemName}"?`,
        description: `${item.inventoryItemName} is removed from "${purchase.purchaseNumber}".`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      }}
      onClick={() =>
        removeMutation.mutate(
          { id: purchase.id, itemId: item.id },
          { onSuccess: () => navigate(`${purchasePath(workspaceBase(pathname), purchase)}/items`) },
        )
      }
      isLoading={removeMutation.isPending}
      disabled={!actions || blocker !== null}
      warning={blocker ?? undefined}
      showWarning={blocker !== null}
      permission={binding.permissions.edit}
    />
  );
};

// Why the item can't be removed, or null when it can
function removeBlocker(canEditItems: boolean, purchase: PurchaseDetail, item: PurchaseItemView): string | null {
  if (!canEditItems) return `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;
  if (item.allocatedPrimaryQty > 0)
    return 'Part of it is allocated; remove its allocations or cancel the supplier first.';
  return null;
}
