import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Mail, PackageCheck, Printer, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeletePurchaseOrder } from '@/hooks/useDeletePurchaseOrder';
import { usePurchaseOrder } from '@/hooks/usePurchaseOrder';
import { usePurchaseOrderItems } from '@/hooks/usePurchaseOrderItems';
import { useUpdatePurchaseOrder } from '@/hooks/useUpdatePurchaseOrder';
import type { PurchaseOrderStatus } from '@/schemas/purchase-orders';
import { downloadPurchaseOrderPdf, updatePurchaseOrderStatus } from '@/services/purchase-orders.service';
import { AddPurchaseOrderItemDialog } from './forms/AddPurchaseOrderItemDialog';
import { ReceiveGoodsDialog } from './forms/ReceiveGoodsDialog';
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
  SENT: { label: 'Confirm Order', status: 'CONFIRMED' },
};

export const PurchaseOrderDetailPage = () => {
  const { id } = useSlugParams('poSlug');
  const navigate = useNavigate();
  const { data: po, refetch } = usePurchaseOrder(id);
  const { data: poItems = [] } = usePurchaseOrderItems(id);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const addItemDialog = useDialog();
  const receiveDialog = useDialog();
  const sendEmailDialog = useDialog();
  const confirm = useConfirm();
  const removeMutation = useUpdatePurchaseOrder();
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
        await updatePurchaseOrderStatus({ id, status: nextStatus });
        refetch();
      }
    },
    [id, confirm, refetch],
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
      await updatePurchaseOrderStatus({ id, status: 'CANCELLED' });
      refetch();
    }
  }, [id, confirm, refetch]);

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

  if (!po) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Purchase order not found.</div>
    );
  }

  const statusBadgeConfig = statusConfig[po.status];
  const nextAction = nextStatusAction[po.status];
  const canModifyItems = po.status === 'DRAFT';
  const canReceive = po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED';
  const canCancel = po.status !== 'CANCELLED' && po.status !== 'RECEIVED';
  const canSendEmail = po.status !== 'CANCELLED';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={po.poNumber}
        description={po.supplierName ?? 'Purchase Order'}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeConfig.variant} className={statusBadgeConfig.className}>
              {statusBadgeConfig.label}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              startAdornment={isDownloadingPdf ? <Spinner className="size-4" /> : <Printer className="size-4" />}
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
            >
              {isDownloadingPdf ? 'Generating...' : 'Print / PDF'}
            </Button>
            {canSendEmail && (
              <Button
                size="sm"
                variant="outline"
                startAdornment={<Mail className="size-4" />}
                onClick={sendEmailDialog.open}
              >
                Send Email
              </Button>
            )}
            {nextAction && (
              <Button
                size="sm"
                startAdornment={<Send className="size-4" />}
                onClick={() => handleStatusChange(nextAction.status, nextAction.label)}
              >
                {nextAction.label}
              </Button>
            )}
            {canReceive && (
              <Button size="sm" startAdornment={<PackageCheck className="size-4" />} onClick={receiveDialog.open}>
                Receive Goods
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" size="sm" className="text-destructive" onClick={handleCancelOrder}>
                Cancel Order
              </Button>
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
            content: (
              <GoodsReceiptsTab
                poId={po.id}
                canReceive={canReceive}
                isActive={activeTab === 'receipts'}
                onOpenReceiveDialog={receiveDialog.open}
              />
            ),
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

      <Dialog
        handle={receiveDialog}
        title="Create Goods Receipt"
        description="Create a draft goods receipt linked to this purchase order."
        className="sm:max-w-2xl"
        content={(close) => <ReceiveGoodsDialog purchaseOrder={po} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={sendEmailDialog}
        title="Send Purchase Order Email"
        description="Send this purchase order to the supplier. Leave recipient empty to use supplier email."
        content={(close) => <SendPurchaseOrderEmailDialog purchaseOrder={po} onSuccess={close} onCancel={close} />}
      />

      {po.status === 'DRAFT' && (
        <DangerZone
          title="Delete this draft purchase order"
          description="This action cannot be undone. The purchase order and all its line items will be permanently removed."
          buttonText="Delete Draft"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
