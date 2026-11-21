import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Ban } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PurchaseDetail } from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { CancelPurchaseDialog } from './forms/CancelPurchaseDialog';

interface PurchaseDangerZoneProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// The purchase's destructive actions: cancelling it while nothing is received, deleting it while no supplier is added;
// each disabled with the reason it is blocked
export const PurchaseDangerZone: React.FC<PurchaseDangerZoneProps> = ({ binding, purchase }) => {
  const navigate = useNavigate();
  const cancelDialog = useDialog();
  const deleteMutation = binding.useDelete();
  const { purchaseNumber } = purchase;
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const cancelBlocker = actions?.blockers.cancel ?? null;
  const deleteBlocker = actions?.blockers.delete ?? null;

  return (
    <div className="flex flex-col gap-4">
      <DangerZone
        title="Cancel Purchase"
        description="Stop this purchase and cancel its open suppliers with their orders and planned deliveries. It stays on record, with the reason saved on it."
        buttonText="Cancel Purchase"
        onClick={cancelDialog.open}
        disabled={!actions || cancelBlocker !== null}
        warning={cancelBlocker ?? undefined}
        showWarning={cancelBlocker !== null}
        permission={binding.permissions.delete}
      />
      <DangerZone
        title="Delete Purchase"
        description="Permanently remove this purchase and its items. Possible until a supplier is added; after that it can only be cancelled or closed."
        buttonText="Delete Purchase"
        confirm={{
          title: `Delete "${purchaseNumber}"?`,
          description: `"${purchaseNumber}" and its items will be permanently removed.`,
          confirmLabel: 'Delete',
          variant: 'destructive',
        }}
        onClick={() => deleteMutation.mutate(purchase.id, { onSuccess: () => navigate('..') })}
        isLoading={deleteMutation.isPending}
        disabled={!actions || deleteBlocker !== null}
        warning={deleteBlocker ?? undefined}
        showWarning={deleteBlocker !== null}
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
    </div>
  );
};
