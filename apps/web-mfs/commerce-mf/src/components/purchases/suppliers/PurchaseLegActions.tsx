import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type React from 'react';
import { type PurchaseHeader, type PurchaseLeg, PurchaseLegActionValues } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';
import { RejectLegDialog } from './forms/RejectLegDialog';

interface PurchaseLegActionsProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  leg: PurchaseLeg;
}

// A supplier leg's actions: approve or reject it when the user is one of its approvers, submit it again once back in
// sourcing
export const PurchaseLegActions: React.FC<PurchaseLegActionsProps> = ({ binding, purchase, leg }) => {
  const { permissions } = binding;
  const confirm = useConfirm();
  const rejectDialog = useDialog();
  const approveMutation = binding.useApproveLeg();
  const submitMutation = binding.useSubmitLeg();
  const legRef = { id: purchase.id, legId: leg.id };

  // Confirms and approves the leg, letting it on to its first fulfilment step
  const handleApprove = async () => {
    const confirmed = await confirm({
      title: `Approve ${leg.supplierName}?`,
      description: `${leg.supplierName}'s allocations are locked and the leg moves on to its first step.`,
      confirmLabel: 'Approve',
    });
    if (confirmed) approveMutation.mutate(legRef);
  };

  // Confirms and submits the supplier on its own, back out of sourcing
  const handleSubmit = async () => {
    const confirmed = await confirm({
      title: `Submit ${leg.supplierName}?`,
      description:
        'The supplier goes to approval again where its settings ask for it, otherwise straight to its first step.',
      confirmLabel: 'Submit Supplier',
    });
    if (confirmed) submitMutation.mutate(legRef);
  };

  return (
    <div className="flex items-center gap-2">
      {leg.availableActions.includes(PurchaseLegActionValues.REJECT) && (
        <Button
          size="sm"
          variant="outline"
          permission={permissions.approve}
          startAdornment={<XCircle className="size-4" />}
          onClick={rejectDialog.open}
        >
          Reject
        </Button>
      )}
      {leg.availableActions.includes(PurchaseLegActionValues.APPROVE) && (
        <Button
          size="sm"
          permission={permissions.approve}
          startAdornment={<CheckCircle2 className="size-4" />}
          onClick={handleApprove}
          isLoading={approveMutation.isPending}
        >
          Approve
        </Button>
      )}
      {leg.availableActions.includes(PurchaseLegActionValues.SUBMIT) && (
        <Button
          size="sm"
          permission={permissions.edit}
          startAdornment={<RotateCcw className="size-4" />}
          onClick={handleSubmit}
          isLoading={submitMutation.isPending}
          disabled={leg.allocations.length === 0}
          disabledTip="Allocate an item to this supplier before submitting it."
        >
          Submit Supplier
        </Button>
      )}
      <Dialog
        handle={rejectDialog}
        icon={XCircle}
        iconVariant="destructive"
        title={`Reject ${leg.supplierName}?`}
        description="Only this supplier goes back to sourcing; its allocations become editable again."
        content={(close) => (
          <RejectLegDialog binding={binding} purchase={purchase} leg={leg} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
