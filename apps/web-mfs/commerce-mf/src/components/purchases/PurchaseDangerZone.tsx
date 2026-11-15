import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Ban } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseActionValues, type PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { CancelPurchaseDialog } from './forms/CancelPurchaseDialog';

interface PurchaseDangerZoneProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
}

// The purchase's one destructive action: deleting it while nothing exists behind it yet, cancelling it once anything
// does; nothing once it is completed or cancelled
export const PurchaseDangerZone: React.FC<PurchaseDangerZoneProps> = ({ binding, purchase }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const cancelDialog = useDialog();
  const deleteMutation = binding.useDelete();
  const { purchaseNumber } = purchase;

  // Confirms and deletes the purchase, returning to the list
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${purchaseNumber}"?`,
      description: `"${purchaseNumber}" and its items will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(purchase.id, { onSuccess: () => navigate('..') });
  };

  if (purchase.availableActions.includes(PurchaseActionValues.DELETE)) {
    return (
      <DangerZone
        title="Delete Purchase"
        description="Permanently remove this purchase and its items. Possible until a quotation is requested or a supplier is allocated; after that it can only be cancelled."
        buttonText="Delete Purchase"
        onClick={handleDelete}
        isLoading={deleteMutation.isPending}
        permission={binding.permissions.delete}
      />
    );
  }

  if (purchase.availableActions.includes(PurchaseActionValues.CANCEL)) {
    return (
      <>
        <DangerZone
          title="Cancel Purchase"
          description="Stop this purchase and cancel its open suppliers. It stays on record, with the reason saved on it."
          buttonText="Cancel Purchase"
          onClick={cancelDialog.open}
          permission={binding.permissions.delete}
        />
        <Dialog
          handle={cancelDialog}
          icon={Ban}
          iconVariant="destructive"
          title={`Cancel "${purchaseNumber}"?`}
          description="The purchase stops here and its open suppliers are cancelled. This cannot be undone."
          content={(close) => (
            <CancelPurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
          )}
        />
      </>
    );
  }

  return null;
};
