import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PackageCheck, Pencil, Send } from 'lucide-react';
import type React from 'react';
import { PurchaseActionValues, type PurchaseDetail, purchaseStatusConfig } from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { ClosePurchaseDialog } from './forms/ClosePurchaseDialog';
import { UpdatePurchaseDialog } from './forms/UpdatePurchaseDialog';

interface PurchaseDetailActionsProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// The purchase's own actions: edit its details while open, submit the suppliers still in sourcing, and close it once
// goods are received; each stays visible and says why when it can't run
export const PurchaseDetailActions: React.FC<PurchaseDetailActionsProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const confirm = useConfirm();
  const editDialog = useDialog();
  const closeDialog = useDialog();
  const submitMutation = binding.useSubmit();
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const closeBlocker = actions?.blockers.close ?? null;
  const submitBlocker = actions?.blockers.submit ?? null;

  // Confirms and starts every supplier still in sourcing — to approval or its first step
  const handleSubmit = async () => {
    const confirmed = await confirm({
      title: 'Submit suppliers?',
      description:
        'Every supplier still in sourcing starts — each goes to approval where its settings ask for it, otherwise straight to its first step.',
      confirmLabel: 'Submit',
    });
    if (confirmed) submitMutation.mutate(purchase.id);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        permission={permissions.edit}
        startAdornment={<Pencil className="size-4" />}
        onClick={editDialog.open}
        disabled={!actions?.availableActions.includes(PurchaseActionValues.EDIT)}
        disabledTip={`The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`}
      >
        Edit
      </Button>
      <Button
        size="sm"
        variant="outline"
        permission={permissions.close}
        startAdornment={<PackageCheck className="size-4" />}
        onClick={closeDialog.open}
        disabled={!actions || closeBlocker !== null}
        disabledTip={closeBlocker ?? undefined}
      >
        Close Purchase
      </Button>
      <Button
        size="sm"
        permission={permissions.edit}
        startAdornment={<Send className="size-4" />}
        onClick={handleSubmit}
        isLoading={submitMutation.isPending}
        disabled={!actions || submitBlocker !== null}
        disabledTip={submitBlocker ?? undefined}
      >
        Submit
      </Button>
      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Purchase"
        description="Change whether quotations are required and its notes."
        content={(close) => (
          <UpdatePurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
        )}
      />
      <Dialog
        handle={closeDialog}
        icon={PackageCheck}
        title={`Close "${purchase.purchaseNumber}"?`}
        description="Suppliers with received goods stop receiving and stay open for their invoices; the others are cancelled, and what is not allocated is dropped."
        content={(close) => (
          <ClosePurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
