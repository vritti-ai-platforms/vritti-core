import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { useConfirm, useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import {
  Ban,
  CalendarClock,
  Mail,
  MoreVertical,
  PackageX,
  Pencil,
  Printer,
  Send,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ManualPurchaseOrderStatus,
  nextPurchaseOrderStatusAction,
  type PurchaseOrderDetail,
  type PurchaseOrderStatus,
  purchaseOrderStatusConfig,
  RECEIVABLE_PURCHASE_ORDER_STATUSES,
} from '@/schemas/purchase-orders';
import type { PurchaseOrdersBinding } from './bindings';
import { ChangeConversionRateDialog } from './forms/ChangeConversionRateDialog';
import { ChangeExchangeRateDialog } from './forms/ChangeExchangeRateDialog';
import { ChangeSupplierDialog } from './forms/ChangeSupplierDialog';
import { SendEmailDialog } from './forms/SendEmailDialog';
import { UpdateNotesDialog } from './forms/UpdateNotesDialog';
import { UpdateTaxDateDialog } from './forms/UpdateTaxDateDialog';

const OPEN_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'];
const CANCELLABLE_STATUSES: PurchaseOrderStatus[] = ['SENT', 'CONFIRMED'];
const TAX_DATE_EDITABLE_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'CONFIRMED'];

interface PurchaseOrderActionsProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
  hasLines: boolean;
}

// Opens a downloaded PDF in a new tab, releasing it once the tab has had time to load it
function openPdf(pdf: Blob) {
  const url = URL.createObjectURL(pdf);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// The order's header actions: its next manual step and the Actions menu
export const PurchaseOrderActions: React.FC<PurchaseOrderActionsProps> = ({ binding, purchaseOrder, hasLines }) => {
  const { permissions } = binding;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const leCurrencyCode = useWorkspaceCurrency();
  const updateStatusMutation = binding.useUpdateStatus();
  const closeMutation = binding.useClose();
  const deleteMutation = binding.useDelete();
  const downloadPdfMutation = binding.useDownloadPdf({ onSuccess: openPdf });

  const { status, poNumber } = purchaseOrder;
  const nextAction = nextPurchaseOrderStatusAction[status];
  const isOpen = OPEN_STATUSES.includes(status);
  const isPricingLocked = purchaseOrder.hasPublishedGoodsReceipt;

  // Confirms and applies a manual status step
  const handleStatusChange = async (nextStatus: ManualPurchaseOrderStatus, label: string) => {
    const confirmed = await confirm({
      title: `${label}?`,
      description: `"${poNumber}" will move to "${purchaseOrderStatusConfig[nextStatus].label}".`,
      confirmLabel: label,
    });
    if (confirmed) updateStatusMutation.mutate({ id: purchaseOrder.id, status: nextStatus });
  };

  // Confirms and cancels the order
  const handleCancelOrder = async () => {
    const confirmed = await confirm({
      title: `Cancel "${poNumber}"?`,
      description: `"${poNumber}" will be marked as cancelled and can no longer be received against. This cannot be undone.`,
      confirmLabel: 'Cancel Order',
      variant: 'destructive',
    });
    if (confirmed) updateStatusMutation.mutate({ id: purchaseOrder.id, status: 'CANCELLED' });
  };

  // Confirms and closes the order short of its ordered quantities
  const handleClose = async () => {
    const confirmed = await confirm({
      title: `Close "${poNumber}"?`,
      description:
        'No further goods receipts will be allowed. Quantities already received are kept; the remaining balance is abandoned.',
      confirmLabel: 'Close PO',
    });
    if (confirmed) closeMutation.mutate(purchaseOrder.id);
  };

  // Confirms and deletes the draft, returning to the list
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${poNumber}"?`,
      description: `"${poNumber}" and all its line items will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(purchaseOrder.id, { onSuccess: () => navigate('..') });
  };

  const menuItems: MenuItem[] = [
    {
      type: 'item',
      id: 'print-pdf',
      label: downloadPdfMutation.isPending ? 'Generating...' : 'Print / PDF',
      icon: Printer,
      disabled: downloadPdfMutation.isPending,
      onClick: () => downloadPdfMutation.mutate(purchaseOrder.id),
    },
    {
      type: 'dialog',
      id: 'update-notes',
      label: 'Update Notes',
      icon: Pencil,
      permission: permissions.edit,
      dialog: {
        title: 'Update Notes',
        description: 'Edit purchase order notes.',
        content: (close) => (
          <UpdateNotesDialog binding={binding} purchaseOrder={purchaseOrder} onSuccess={close} onCancel={close} />
        ),
      },
    },
    {
      type: 'dialog',
      id: 'update-tax-date',
      label: 'Change Tax Date',
      icon: CalendarClock,
      permission: permissions.edit,
      hidden: !TAX_DATE_EDITABLE_STATUSES.includes(status),
      disabled: isPricingLocked,
      dialog: {
        title: 'Change Tax Date',
        description:
          'The date tax is determined on. Lines that follow the order move with it; lines with their own keep it.',
        content: (close) => (
          <UpdateTaxDateDialog binding={binding} purchaseOrder={purchaseOrder} onSuccess={close} onCancel={close} />
        ),
      },
    },
    {
      type: 'dialog',
      id: 'change-supplier',
      label: 'Change Supplier',
      icon: Truck,
      permission: permissions.edit,
      hidden: status !== 'DRAFT',
      dialog: hasLines
        ? { title: 'Change Supplier', description: 'Remove all line items before changing the supplier.' }
        : {
            title: 'Change Supplier',
            description: 'Select a new supplier for this purchase order.',
            content: (close) => (
              <ChangeSupplierDialog
                binding={binding}
                purchaseOrder={purchaseOrder}
                onSuccess={close}
                onCancel={close}
              />
            ),
          },
    },
    {
      type: 'dialog',
      id: 'change-exchange-rate',
      label: 'Change Exchange Rate',
      icon: Wallet,
      permission: permissions.edit,
      hidden: !isOpen || purchaseOrder.currencyCode === leCurrencyCode,
      disabled: isPricingLocked,
      dialog: {
        title: 'Change Exchange Rate',
        description: `How much 1 ${purchaseOrder.currencyCode} is in ${leCurrencyCode}. Locks once a goods receipt is published.`,
        content: (close) => (
          <ChangeExchangeRateDialog
            binding={binding}
            purchaseOrder={purchaseOrder}
            onSuccess={close}
            onCancel={close}
          />
        ),
      },
    },
    {
      type: 'dialog',
      id: 'change-conversion-rate',
      label: 'Change Conversion Rate',
      icon: Wallet,
      permission: permissions.edit,
      hidden: !isOpen || Object.keys(purchaseOrder.conversionRates).length === 0,
      disabled: isPricingLocked,
      dialog: {
        title: 'Change Conversion Rate',
        description:
          "Rate from one of the supplier's other currencies into the PO currency. Locks once a goods receipt is published.",
        content: (close) => (
          <ChangeConversionRateDialog
            binding={binding}
            purchaseOrder={purchaseOrder}
            onSuccess={close}
            onCancel={close}
          />
        ),
      },
    },
    {
      type: 'dialog',
      id: 'send-email',
      label: 'Send Email',
      icon: Mail,
      permission: permissions.edit,
      hidden: status === 'CANCELLED',
      disabled: !hasLines,
      dialog: {
        title: 'Send Purchase Order Email',
        description: 'Send this purchase order to the supplier. Leave recipient empty to use supplier email.',
        content: (close) => (
          <SendEmailDialog binding={binding} purchaseOrder={purchaseOrder} onSuccess={close} onCancel={close} />
        ),
      },
    },
    {
      type: 'item',
      id: 'close-po',
      label: 'Close PO',
      icon: PackageX,
      permission: permissions.edit,
      hidden: !RECEIVABLE_PURCHASE_ORDER_STATUSES.includes(status),
      disabled: closeMutation.isPending,
      onClick: handleClose,
    },
    {
      type: 'item',
      id: 'cancel-order',
      label: 'Cancel Order',
      icon: Ban,
      variant: 'destructive',
      permission: permissions.edit,
      hidden: !CANCELLABLE_STATUSES.includes(status),
      onClick: handleCancelOrder,
    },
    {
      type: 'item',
      id: 'delete-draft',
      label: 'Delete Draft',
      icon: Trash2,
      variant: 'destructive',
      permission: permissions.delete,
      hidden: status !== 'DRAFT',
      disabled: deleteMutation.isPending,
      onClick: handleDelete,
    },
  ];

  return (
    <div className="flex items-center gap-2">
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
      {nextAction && (
        <Button
          size="sm"
          permission={permissions.edit}
          startAdornment={<Send className="size-4" />}
          onClick={() => handleStatusChange(nextAction.status, nextAction.label)}
          isLoading={updateStatusMutation.isPending}
          disabled={!hasLines}
          disabledTip="Add line items before sending the purchase order."
        >
          {nextAction.label}
        </Button>
      )}
    </div>
  );
};
