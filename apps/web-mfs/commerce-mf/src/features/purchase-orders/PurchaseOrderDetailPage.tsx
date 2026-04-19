import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Mail, MoreVertical, Printer, Send, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeletePurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrderItems,
  useUpdatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
} from '@/hooks/purchase-orders';
import type { PurchaseOrderStatus } from '@/schemas/purchase-orders';
import { downloadPurchaseOrderPdf } from '@/services/purchase-orders.service';
import { AddPurchaseOrderItemDialog } from './forms/AddPurchaseOrderItemDialog';
import { SendPurchaseOrderEmailDialog } from './forms/SendPurchaseOrderEmailDialog';
import { GoodsReceiptsTab } from './tabs/GoodsReceiptsTab';
import { LineItemsTab } from './tabs/LineItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

const statusConfig: Record<
  PurchaseOrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  SENT: { label: 'Sent', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary', className: 'bg-success/15 text-success' },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  RECEIVED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const nextStatusAction: Partial<Record<PurchaseOrderStatus, { label: string; status: PurchaseOrderStatus }>> = {
  DRAFT: { label: 'Mark as Sent', status: 'SENT' },
  SENT: { label: 'Confirm Purchase Order', status: 'CONFIRMED' },
};

type PrimaryAction = {
  label: string;
  onClick: () => void;
  icon?: typeof Send;
  variant?: 'default' | 'destructive';
};

export const PurchaseOrderDetailPage = () => {
  const { id } = useSlugParams('poSlug');
  const navigate = useNavigate();
  const { data: po } = usePurchaseOrder(id);
  const { data: poItems = [] } = usePurchaseOrderItems(id);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const addItemDialog = useDialog();
  const confirm = useConfirm();
  const removeMutation = useUpdatePurchaseOrder();
  const updateStatusMutation = useUpdatePurchaseOrderStatus();
  const deleteMutation = useDeletePurchaseOrder();

  const handleStatusChange = useCallback(
    async (nextStatus: PurchaseOrderStatus, label: string) => {
      if (!id) return;
      const confirmed = await confirm({
        title: `${label}?`,
        description: `This will change the purchase order status to "${statusConfig[nextStatus].label}".`,
        confirmLabel: label,
      });
      if (confirmed) {
        await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      }
    },
    [id, confirm, updateStatusMutation],
  );

  const handleCancelOrder = useCallback(async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Cancel Purchase Order?',
      description: 'This action cannot be undone. The purchase order will be marked as cancelled.',
      confirmLabel: 'Cancel Order',
      variant: 'destructive',
    });
    if (confirmed) {
      await updateStatusMutation.mutateAsync({ id, status: 'CANCELLED' });
    }
  }, [id, confirm, updateStatusMutation]);

  const handleDelete = useCallback(async () => {
    if (!id || !po) return;
    const confirmed = await confirm({
      title: `Delete "${po.poNumber}"?`,
      description: 'This purchase order and all its line items will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(id, { onSuccess: () => navigate('..') });
    }
  }, [id, po, confirm, deleteMutation, navigate]);

  const handleRemoveItem = useCallback(
    async (inventoryItemId: string, itemName: string) => {
      if (!po) return;
      const confirmed = await confirm({
        title: `Remove "${itemName}"?`,
        description: 'This line item will be removed from the purchase order.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) {
        removeMutation.mutate({
          id: po.id,
          data: {
            items: poItems
              .filter((i) => i.inventoryItemId !== inventoryItemId)
              .map((i) => ({
                inventoryItemId: i.inventoryItemId,
                orderedQuantity: i.orderedQuantity,
                unitPrice: i.unitPrice ?? undefined,
              })),
          },
        });
      }
    },
    [po, poItems, confirm, removeMutation],
  );

  // Opens the server-generated PDF in a new browser tab
  const handleDownloadPdf = useCallback(async () => {
    if (!id) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadPurchaseOrderPdf(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [id]);

  const renderSendEmailDialog = useCallback(
    (close: () => void) => <SendPurchaseOrderEmailDialog purchaseOrder={po} onSuccess={close} onCancel={close} />,
    [po],
  );

  const statusBadgeConfig = statusConfig[po.status];
  const nextAction = nextStatusAction[po.status];
  const canModifyItems = po.status === 'DRAFT';
  const canCancel = po.status !== 'DRAFT' && po.status !== 'CANCELLED' && po.status !== 'RECEIVED';
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
  ];

  if (canSendEmail) {
    actionMenuItems.push({
      type: 'dialog',
      id: 'send-email',
      label: 'Send Email',
      icon: Mail,
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={po.poNumber}
        titleSlot={
          <Badge variant={statusBadgeConfig.variant} className={statusBadgeConfig.className}>
            {statusBadgeConfig.label}
          </Badge>
        }
        description={po.supplierName ?? 'Purchase Order'}
        actions={
          <div className="flex items-center gap-2">
            {primaryAction && (
              <Button
                size="sm"
                variant={primaryAction.variant}
                startAdornment={primaryAction.icon ? <primaryAction.icon className="size-4" /> : undefined}
                onClick={primaryAction.onClick}
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
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab po={po} status={statusBadgeConfig} />,
          },
          {
            value: 'items',
            label: `Line Items (${poItems.length})`,
            content: (
              <LineItemsTab
                purchaseOrderId={po.id}
                canModifyItems={canModifyItems}
                onOpenAddItemDialog={addItemDialog.open}
                onRemoveItem={handleRemoveItem}
              />
            ),
          },
          {
            value: 'receipts',
            label: 'Goods Receipts',
            content: <GoodsReceiptsTab poId={po.id} isActive={activeTab === 'receipts'} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={addItemDialog}
        title="Add Line Item"
        description="Add an inventory item to this purchase order."
        content={(close) => (
          <AddPurchaseOrderItemDialog purchaseOrder={po} items={poItems} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
