import { Button } from '@vritti/quantum-ui/Button';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { useBUCurrency, useConfirm } from '@vritti/quantum-ui/hooks';
import { Mail, MoreVertical, PackageX, Pencil, Printer, Send, Trash2, Truck, Wallet } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useClosePurchaseOrder,
  useDeletePurchaseOrder,
  useUpdatePurchaseOrderStatus,
} from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail, PurchaseOrderStatus } from '@/schemas/purchase-orders';
import { downloadPurchaseOrderPdf } from '@/services/purchase-orders.service';
import { ChangePurchaseOrderExchangeRateDialog } from '../forms/ChangePurchaseOrderExchangeRateDialog';
import { ChangePurchaseOrderSupplierDialog } from '../forms/ChangePurchaseOrderSupplierDialog';
import { SendPurchaseOrderEmailDialog } from '../forms/SendPurchaseOrderEmailDialog';
import { UpdatePurchaseOrderNotesDialog } from '../forms/UpdatePurchaseOrderNotesDialog';
import { nextPurchaseOrderStatusAction, purchaseOrderStatusConfig } from '../status-config';

interface PurchaseOrderActionsProps {
  po: PurchaseOrderDetail;
  poItemIds: string[];
}

type PrimaryAction = {
  label: string;
  onClick: () => void;
  icon?: typeof Send;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  disabledTip?: string;
};

export const PurchaseOrderActions = ({ po, poItemIds }: PurchaseOrderActionsProps) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const updateStatusMutation = useUpdatePurchaseOrderStatus();
  const deleteMutation = useDeletePurchaseOrder();
  const closeMutation = useClosePurchaseOrder();
  const buCurrencyCode = useBUCurrency();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleStatusChange = useCallback(
    async (nextStatus: PurchaseOrderStatus, label: string) => {
      const confirmed = await confirm({
        title: `${label}?`,
        description: `This will change the purchase order status to "${purchaseOrderStatusConfig[nextStatus].label}".`,
        alert:
          nextStatus === 'SENT'
            ? {
                type: 'warning',
                text: 'You cannot add any line items after this action.',
              }
            : undefined,
        confirmLabel: label,
      });
      if (confirmed) {
        await updateStatusMutation.mutateAsync({ id: po.id, status: nextStatus });
      }
    },
    [po.id, confirm, updateStatusMutation],
  );

  const handleCancelOrder = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Cancel Purchase Order?',
      description: 'This action cannot be undone. The purchase order will be marked as cancelled.',
      confirmLabel: 'Cancel Order',
      variant: 'destructive',
    });
    if (confirmed) {
      await updateStatusMutation.mutateAsync({ id: po.id, status: 'CANCELLED' });
    }
  }, [po.id, confirm, updateStatusMutation]);

  const handleCloseShort = useCallback(async () => {
    const confirmed = await confirm({
      title: `Close "${po.poNumber}"?`,
      description:
        'No further goods receipts will be allowed. Quantities already received are kept; the remaining balance is abandoned.',
      confirmLabel: 'Close PO',
    });
    if (confirmed) {
      await closeMutation.mutateAsync(po.id);
    }
  }, [po.id, po.poNumber, confirm, closeMutation]);

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete "${po.poNumber}"?`,
      description: 'This purchase order and all its line items will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(po.id, { onSuccess: () => navigate('..') });
    }
  }, [po.id, po.poNumber, confirm, deleteMutation, navigate]);

  // Opens the server-generated PDF in a new browser tab
  const handleDownloadPdf = useCallback(async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadPurchaseOrderPdf(po.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [po.id]);

  const renderSendEmailDialog = useCallback(
    (close: () => void) => <SendPurchaseOrderEmailDialog purchaseOrder={po} onSuccess={close} onCancel={close} />,
    [po],
  );
  const renderUpdateNotesDialog = useCallback(
    (close: () => void) => <UpdatePurchaseOrderNotesDialog purchaseOrder={po} onSuccess={close} onCancel={close} />,
    [po],
  );
  const renderChangeSupplierDialog = useCallback(
    (close: () => void) => (
      <ChangePurchaseOrderSupplierDialog
        purchaseOrder={po}
        hasLines={poItemIds.length > 0}
        onSuccess={close}
        onCancel={close}
      />
    ),
    [po, poItemIds.length],
  );
  const renderChangeExchangeRateDialog = useCallback(
    (close: () => void) => (
      <ChangePurchaseOrderExchangeRateDialog purchaseOrder={po} onSuccess={close} onCancel={close} />
    ),
    [po],
  );

  const isCrossCurrency = !!buCurrencyCode && po.currencyCode !== buCurrencyCode;
  const isPreReceipt = po.status === 'DRAFT' || po.status === 'SENT' || po.status === 'CONFIRMED';
  const canChangeExchangeRate = isCrossCurrency && isPreReceipt;
  const canClose = po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED';

  const nextAction = nextPurchaseOrderStatusAction[po.status];
  const totalAmountValue = Number(po.totalAmount?.value ?? 0);
  const hasPositiveTotalAmount = Number.isFinite(totalAmountValue) && totalAmountValue > 0;
  const requiresPositiveTotalToSend = po.status === 'DRAFT' && !hasPositiveTotalAmount;
  const markAsSentDisabledTip = requiresPositiveTotalToSend
    ? 'Add Line Items to Mark the Purchase Order as Sent'
    : undefined;
  const canCancel =
    po.status !== 'DRAFT' &&
    po.status !== 'CANCELLED' &&
    po.status !== 'RECEIVED' &&
    po.status !== 'CLOSED' &&
    po.status !== 'PARTIALLY_RECEIVED';
  const canSendEmail = po.status !== 'CANCELLED';

  const primaryAction: PrimaryAction | undefined =
    po.status === 'CONFIRMED'
      ? {
          label: 'Cancel Order',
          onClick: handleCancelOrder,
          variant: 'destructive',
        }
      : nextAction
        ? {
            label: nextAction.label,
            onClick: () => handleStatusChange(nextAction.status, nextAction.label),
            icon: Send,
            disabled: nextAction.status === 'SENT' && requiresPositiveTotalToSend,
            disabledTip: nextAction.status === 'SENT' ? markAsSentDisabledTip : undefined,
          }
        : undefined;

  const actionMenuItems: MenuItem[] = [
    {
      type: 'item',
      id: 'print-pdf',
      label: isDownloadingPdf ? 'Generating...' : 'Print / PDF',
      icon: Printer,
      onClick: handleDownloadPdf,
      disabled: isDownloadingPdf,
    },
    {
      type: 'dialog',
      id: 'update-notes',
      label: 'Update Notes',
      icon: Pencil,
      dialog: {
        title: 'Update Notes',
        description: 'Edit purchase order notes.',
        content: renderUpdateNotesDialog,
      },
    },
  ];

  if (po.status === 'DRAFT') {
    actionMenuItems.push({
      type: 'dialog',
      id: 'change-supplier',
      label: 'Change Supplier',
      icon: Truck,
      dialog: {
        title: 'Change Supplier',
        description:
          poItemIds.length > 0
            ? 'Remove all line items before changing supplier.'
            : 'Select a new supplier for this purchase order.',
        content: renderChangeSupplierDialog,
      },
    });
  }

  if (canChangeExchangeRate) {
    actionMenuItems.push({
      type: 'dialog',
      id: 'change-exchange-rate',
      label: 'Change Exchange Rate',
      icon: Wallet,
      dialog: {
        title: 'Change Exchange Rate',
        description: 'Edit the rate policy or value. Locks once a goods receipt is posted.',
        content: renderChangeExchangeRateDialog,
      },
    });
  }

  if (canSendEmail) {
    actionMenuItems.push({
      type: 'dialog',
      id: 'send-email',
      label: 'Send Email',
      icon: Mail,
      disabled: requiresPositiveTotalToSend,
      dialog: {
        title: 'Send Purchase Order Email',
        description: 'Send this purchase order to the supplier. Leave recipient empty to use supplier email.',
        content: renderSendEmailDialog,
      },
    });
  }

  if (nextAction && po.status !== 'DRAFT' && po.status !== 'SENT') {
    actionMenuItems.push({
      type: 'item',
      id: `status-${nextAction.status.toLowerCase()}`,
      label: nextAction.label,
      icon: Send,
      onClick: () => handleStatusChange(nextAction.status, nextAction.label),
    });
  }

  if (canClose) {
    actionMenuItems.push({
      type: 'item',
      id: 'close-po',
      label: 'Close PO',
      icon: PackageX,
      onClick: handleCloseShort,
      disabled: closeMutation.isPending,
    });
  }

  if (canCancel && po.status !== 'CONFIRMED') {
    actionMenuItems.push({
      type: 'item',
      id: 'cancel-order',
      label: 'Cancel Order',
      icon: Send,
      variant: 'destructive',
      onClick: handleCancelOrder,
    });
  }

  if (po.status === 'DRAFT') {
    actionMenuItems.push({
      type: 'item',
      id: 'delete-draft',
      label: 'Delete Draft',
      icon: Trash2,
      variant: 'destructive',
      onClick: handleDelete,
      disabled: deleteMutation.isPending,
    });
  }

  return (
    <div className="flex items-center gap-2">
      {primaryAction && (
        <Button
          size="sm"
          variant={primaryAction.variant}
          startAdornment={primaryAction.icon ? <primaryAction.icon className="size-4" /> : undefined}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          disabledTip={primaryAction.disabledTip}
        >
          {primaryAction.label}
        </Button>
      )}
      {actionMenuItems.length > 0 && (
        <DropdownMenu
          trigger={{
            children: (
              <Button size="sm" variant="outline" endAdornment={<MoreVertical className="size-4" />}>
                Actions
              </Button>
            ),
          }}
          items={actionMenuItems}
          align="end"
        />
      )}
    </div>
  );
};
