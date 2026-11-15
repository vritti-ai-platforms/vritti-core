import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil } from 'lucide-react';
import type React from 'react';
import {
  PurchaseActionValues,
  type PurchaseHeader,
  PurchaseStatusValues,
  purchaseStatusConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { UpdatePurchaseDialog } from './forms/UpdatePurchaseDialog';

interface PurchaseHeaderActionsProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
}

// Editing the purchase's details, open while it is in Requesting
export const PurchaseHeaderActions: React.FC<PurchaseHeaderActionsProps> = ({ binding, purchase }) => {
  const editDialog = useDialog();
  const canEdit = purchase.availableActions.includes(PurchaseActionValues.EDIT);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        permission={binding.permissions.edit}
        startAdornment={<Pencil className="size-4" />}
        onClick={editDialog.open}
        disabled={!canEdit}
        disabledTip={
          purchase.status === PurchaseStatusValues.OPEN
            ? `Details can be edited while Requesting; the purchase is in ${purchaseStepConfig[purchase.step].label}.`
            : `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`
        }
      >
        Edit
      </Button>
      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Purchase"
        description="Change whether quotations are requested and its notes."
        content={(close) => (
          <UpdatePurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
