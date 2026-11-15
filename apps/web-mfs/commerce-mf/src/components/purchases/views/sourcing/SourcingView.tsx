import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Send } from 'lucide-react';
import type React from 'react';
import { Suspense } from 'react';
import {
  PurchaseActionValues,
  type PurchaseHeader,
  PurchaseStatusValues,
  PurchaseStepValues,
  purchaseStatusConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { PurchaseStageViewSkeleton } from '../../PurchaseDetailSkeleton';
import { SourcingItemsTab } from './SourcingItemsTab';
import { SourcingSuppliersTab } from './SourcingSuppliersTab';

interface SourcingViewProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

// The Sourcing stage: who supplies each item, and a preview of the suppliers that brings in, submitted together from
// the tab strip
export const SourcingView: React.FC<SourcingViewProps> = ({ binding, purchase, readOnly }) => (
  <div className="relative">
    <div className="absolute top-0 right-0 z-10">
      <SubmitSourcingButton binding={binding} purchase={purchase} readOnly={readOnly} />
    </div>
    <Tabs
      tabs={[
        {
          value: 'items',
          label: `Items (${purchase.itemCount})`,
          permission: binding.permissions.view,
          content: (
            <Suspense fallback={<PurchaseStageViewSkeleton mode="stepperTab" />}>
              <SourcingItemsTab binding={binding} purchase={purchase} readOnly={readOnly} />
            </Suspense>
          ),
        },
        {
          value: 'suppliers',
          label: `Suppliers (${purchase.supplierCount})`,
          permission: binding.permissions.view,
          content: (
            <Suspense fallback={<PurchaseStageViewSkeleton mode="stepperTab" />}>
              <SourcingSuppliersTab binding={binding} purchase={purchase} />
            </Suspense>
          ),
        },
      ]}
    />
  </div>
);

interface SubmitSourcingButtonProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

// Submits the sourcing, starting every supplier still in sourcing — to approval or its first step
const SubmitSourcingButton: React.FC<SubmitSourcingButtonProps> = ({ binding, purchase, readOnly }) => {
  const confirm = useConfirm();
  const submitMutation = binding.useSubmit();
  const canSubmit = !readOnly && purchase.availableActions.includes(PurchaseActionValues.SUBMIT);
  const lockedTip =
    purchase.status !== PurchaseStatusValues.OPEN
      ? `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`
      : purchase.step !== PurchaseStepValues.SOURCING
        ? `The sourcing was already submitted; the purchase is in ${purchaseStepConfig[purchase.step].label}.`
        : 'Allocate the items to a supplier before submitting.';

  // Confirms and submits the sourcing; the purchase moves on to Procuring
  const handleSubmit = async () => {
    const confirmed = await confirm({
      title: 'Submit sourcing?',
      description: `${pluralize('supplier', purchase.supplierCount, true)} start — each goes to approval where its settings ask for it, otherwise straight to its first step. The Suppliers tab shows which.`,
      confirmLabel: 'Submit',
    });
    if (confirmed) submitMutation.mutate(purchase.id);
  };

  return (
    <Button
      size="sm"
      permission={binding.permissions.edit}
      startAdornment={<Send className="size-4" />}
      onClick={handleSubmit}
      isLoading={submitMutation.isPending}
      disabled={!canSubmit}
      disabledTip={lockedTip}
    >
      Submit
    </Button>
  );
};
