import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu } from '@vritti/quantum-ui/DropdownMenu';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { FileCheck, FileX, ListOrdered, MoreVertical, PackageCheck, Pencil, Send } from 'lucide-react';
import type React from 'react';
import {
  type PurchaseAction,
  PurchaseActionValues,
  type PurchaseDetail,
  purchaseStatusConfig,
} from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { ChangePurchaseMinQuotationsDialog } from './forms/ChangePurchaseMinQuotationsDialog';
import { ChangePurchaseNotesDialog } from './forms/ChangePurchaseNotesDialog';
import { ClosePurchaseDialog } from './forms/ClosePurchaseDialog';
import { DisablePurchaseQuotationsDialog } from './forms/DisablePurchaseQuotationsDialog';
import { EnablePurchaseQuotationsDialog } from './forms/EnablePurchaseQuotationsDialog';

interface PurchaseDetailActionsProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// The purchase's own actions: an Actions menu for its notes, whether it requires quotations, and closing it once goods
// are received, beside Submit for the suppliers still in sourcing; each stays visible and says why when it can't run
export const PurchaseDetailActions: React.FC<PurchaseDetailActionsProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const confirm = useConfirm();
  const submitMutation = binding.useSubmit();
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const closeBlocker = actions?.blockers.close ?? null;
  const submitBlocker = actions?.blockers.submit ?? null;
  const closedTip = `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;
  const can = (action: PurchaseAction) => actions?.availableActions.includes(action) ?? false;

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
      <DropdownMenu
        align="end"
        trigger={{
          children: (
            <Button size="sm" variant="outline" endAdornment={<MoreVertical className="size-4" />}>
              Actions
            </Button>
          ),
        }}
        items={[
          {
            type: 'dialog',
            id: 'change-notes',
            icon: Pencil,
            label: 'Change Notes',
            permission: permissions.edit,
            disabled: !can(PurchaseActionValues.CHANGE_NOTES),
            disabledTip: closedTip,
            dialog: {
              title: 'Change Notes',
              description: 'Notes everyone working on this purchase sees.',
              content: (close) => (
                <ChangePurchaseNotesDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
              ),
            },
          },
          {
            type: 'dialog',
            id: 'enable-quotations',
            icon: FileCheck,
            label: 'Enable Quotations',
            permission: permissions.edit,
            hidden: purchase.quotationsRequired,
            disabled: !can(PurchaseActionValues.ENABLE_QUOTATIONS),
            disabledTip: actions?.blockers.enableQuotations ?? undefined,
            dialog: {
              title: 'Enable Quotations',
              description:
                'Items are then allocated from posted quotation lines, and a supplier is submitted only once each of its items has enough quotations.',
              content: (close) => (
                <EnablePurchaseQuotationsDialog
                  binding={binding}
                  purchase={purchase}
                  onSuccess={close}
                  onCancel={close}
                />
              ),
            },
          },
          {
            type: 'dialog',
            id: 'change-min-quotations',
            icon: ListOrdered,
            label: 'Change Minimum Quotations',
            permission: permissions.edit,
            hidden: !purchase.quotationsRequired,
            disabled: !can(PurchaseActionValues.CHANGE_MIN_QUOTATIONS),
            disabledTip: closedTip,
            dialog: {
              title: 'Change Minimum Quotations',
              description: 'How many posted quotations each item needs before its supplier is submitted.',
              content: (close) => (
                <ChangePurchaseMinQuotationsDialog
                  binding={binding}
                  purchase={purchase}
                  onSuccess={close}
                  onCancel={close}
                />
              ),
            },
          },
          {
            type: 'dialog',
            id: 'disable-quotations',
            icon: FileX,
            label: 'Disable Quotations',
            permission: permissions.edit,
            hidden: !purchase.quotationsRequired,
            disabled: !can(PurchaseActionValues.DISABLE_QUOTATIONS),
            disabledTip: closedTip,
            dialog: {
              title: 'Disable Quotations',
              description: 'Items can then be allocated to suppliers directly, without quotations.',
              content: (close) => (
                <DisablePurchaseQuotationsDialog
                  binding={binding}
                  purchase={purchase}
                  onSuccess={close}
                  onCancel={close}
                />
              ),
            },
          },
          { type: 'separator' },
          {
            type: 'dialog',
            id: 'close',
            icon: PackageCheck,
            label: 'Close Purchase',
            permission: permissions.close,
            disabled: !actions || closeBlocker !== null,
            disabledTip: closeBlocker ?? undefined,
            dialog: {
              title: `Close "${purchase.purchaseNumber}"?`,
              description:
                'Suppliers with received goods stop receiving and stay open for their invoices; the others are cancelled, and what is not allocated is dropped.',
              content: (close) => (
                <ClosePurchaseDialog binding={binding} purchase={purchase} onSuccess={close} onCancel={close} />
              ),
            },
          },
        ]}
      />
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
    </div>
  );
};
