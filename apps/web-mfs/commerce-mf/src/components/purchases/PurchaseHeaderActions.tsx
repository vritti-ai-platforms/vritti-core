import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { Ban, MoreVertical, Pencil } from 'lucide-react';
import type React from 'react';
import { PurchaseActionValues, type PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { CancelPurchaseDialog } from './forms/CancelPurchaseDialog';
import { UpdatePurchaseDialog } from './forms/UpdatePurchaseDialog';

interface PurchaseHeaderActionsProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
}

// The purchase's Actions menu: its details while in the Items step, and cancelling it while that is still possible
export const PurchaseHeaderActions: React.FC<PurchaseHeaderActionsProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const canEdit = purchase.availableActions.includes(PurchaseActionValues.EDIT);
  const canCancel = purchase.availableActions.includes(PurchaseActionValues.CANCEL);
  if (!canEdit && !canCancel) return null;

  const menuItems: MenuItem[] = [
    {
      type: 'dialog',
      id: 'edit',
      label: 'Edit Details',
      icon: Pencil,
      permission: permissions.edit,
      hidden: !canEdit,
      dialog: {
        title: 'Edit Purchase',
        description: 'Change whether quotations are requested and its notes.',
        content: (close) => (
          <UpdatePurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
        ),
      },
    },
    {
      type: 'dialog',
      id: 'cancel',
      label: 'Cancel Purchase',
      icon: Ban,
      permission: permissions.delete,
      hidden: !canCancel,
      dialog: {
        title: `Cancel "${purchase.purchaseNumber}"?`,
        description: 'The purchase stops here and its open suppliers are cancelled. This cannot be undone.',
        content: (close) => (
          <CancelPurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
        ),
      },
    },
  ];

  return (
    <DropdownMenu
      trigger={{
        children: (
          <Button size="sm" variant="outline" endAdornment={<MoreVertical className="size-4" />}>
            Actions
          </Button>
        ),
      }}
      items={menuItems}
      align="end"
    />
  );
};
