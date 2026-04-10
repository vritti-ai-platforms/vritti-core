import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { PackageCheck, Plus, Send, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useGoodsReceipts } from '@/hooks/useGoodsReceipts';
import { usePurchaseOrder } from '@/hooks/usePurchaseOrder';
import { useUpdatePurchaseOrder } from '@/hooks/useUpdatePurchaseOrder';
import type { PurchaseOrderStatus } from '@/schemas/purchase-orders';
import { updatePurchaseOrderStatus } from '@/services/purchase-orders.service';
import { AddPurchaseOrderItemDialog } from './forms/AddPurchaseOrderItemDialog';
import { ReceiveGoodsDialog } from './forms/ReceiveGoodsDialog';

const statusConfig: Record<PurchaseOrderStatus, { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }> = {
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
  const { data: po, isLoading, refetch } = usePurchaseOrder(id ?? null);
  const { data: goodsReceipts, isLoading: isLoadingReceipts } = useGoodsReceipts(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const addItemDialog = useDialog();
  const receiveDialog = useDialog();
  const confirm = useConfirm();
  const removeMutation = useUpdatePurchaseOrder();

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

  const handleCancelOrder = useCallback(
    async () => {
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
    },
    [id, confirm, refetch],
  );

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
            items: po.items
              .filter((i) => i.inventoryItemId !== inventoryItemId)
              .map((i) => ({
                inventoryItemId: i.inventoryItemId,
                orderedQuantity: i.orderedQuantity,
              })),
          },
        });
      }
    },
    [po, confirm, removeMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Purchase order not found.
      </div>
    );
  }

  const statusBadgeConfig = statusConfig[po.status];
  const nextAction = nextStatusAction[po.status];
  const canModifyItems = po.status === 'DRAFT';
  const canReceive = po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED';
  const canCancel = po.status !== 'CANCELLED' && po.status !== 'RECEIVED';

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
              <Button
                size="sm"
                startAdornment={<PackageCheck className="size-4" />}
                onClick={receiveDialog.open}
              >
                Receive Goods
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={handleCancelOrder}
              >
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
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">PO Number</p>
                      <p className="mt-1 font-mono font-medium">{po.poNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier</p>
                      <p className="mt-1 font-medium">{po.supplierName ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="mt-1">{new Date(po.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Date</p>
                      <p className="mt-1">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={statusBadgeConfig.variant}
                        className={`mt-1 ${statusBadgeConfig.className ?? ''}`}
                      >
                        {statusBadgeConfig.label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="mt-1 font-mono font-medium">{po.totalAmount != null ? po.totalAmount.toFixed(2) : '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="mt-1">{po.notes ?? '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'items',
            label: `Line Items (${po.items.length})`,
            content: (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  {canModifyItems && (
                    <Button size="sm" onClick={addItemDialog.open}>
                      <Plus className="mr-2 size-4" />
                      Add Line Item
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {po.items.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">
                      No line items added yet.{canModifyItems ? ' Click "Add Line Item" to get started.' : ''}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">#</th>
                            <th className="pb-2 font-medium">Inventory Item</th>
                            <th className="pb-2 font-medium text-right">Ordered</th>
                            <th className="pb-2 font-medium text-right">Received</th>
                            <th className="pb-2 font-medium text-right">Unit Price</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                            {canModifyItems && <th className="pb-2 font-medium text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {po.items.map((item, index) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-3 text-muted-foreground">{index + 1}</td>
                              <td className="py-3 font-medium">{item.inventoryItemName ?? item.inventoryItemId}</td>
                              <td className="py-3 text-right font-mono">{item.orderedQuantity}</td>
                              <td className="py-3 text-right font-mono">{item.receivedQuantity}</td>
                              <td className="py-3 text-right font-mono">{item.unitPrice != null ? item.unitPrice.toFixed(2) : '—'}</td>
                              <td className="py-3 text-right font-mono">{item.totalPrice != null ? item.totalPrice.toFixed(2) : '—'}</td>
                              {canModifyItems && (
                                <td className="py-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleRemoveItem(item.inventoryItemId, item.inventoryItemName ?? 'item')}
                                  >
                                    <Trash2 className="size-4 text-destructive" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'receipts',
            label: `Goods Receipts (${goodsReceipts?.length ?? 0})`,
            content: (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Goods Receipts</CardTitle>
                  {canReceive && (
                    <Button size="sm" onClick={receiveDialog.open}>
                      <PackageCheck className="mr-2 size-4" />
                      Receive Goods
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingReceipts ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner />
                    </div>
                  ) : !goodsReceipts || goodsReceipts.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">
                      No goods receipts recorded yet.{canReceive ? ' Click "Receive Goods" to record a delivery.' : ''}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {goodsReceipts.map((gr) => (
                        <div key={gr.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium">
                                Received on {new Date(gr.receivedDate).toLocaleDateString()}
                              </p>
                              {gr.receivedBy && (
                                <p className="text-sm text-muted-foreground">By: {gr.receivedBy}</p>
                              )}
                            </div>
                            <Badge variant="outline">{gr.items.length} items</Badge>
                          </div>
                          {gr.notes && (
                            <p className="text-sm text-muted-foreground mb-3">{gr.notes}</p>
                          )}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                  <th className="pb-2 font-medium">Item</th>
                                  <th className="pb-2 font-medium text-right">Accepted</th>
                                  <th className="pb-2 font-medium text-right">Rejected</th>
                                  <th className="pb-2 font-medium">Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {gr.items.map((grItem) => (
                                  <tr key={grItem.id} className="border-b last:border-0">
                                    <td className="py-2">{grItem.inventoryItemName ?? grItem.purchaseOrderItemId}</td>
                                    <td className="py-2 text-right font-mono">{grItem.acceptedQuantity}</td>
                                    <td className="py-2 text-right font-mono">{grItem.rejectedQuantity}</td>
                                    <td className="py-2 text-muted-foreground">{grItem.rejectionReason ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
        content={(close) => <AddPurchaseOrderItemDialog purchaseOrder={po} onSuccess={close} onCancel={close} />}
      />

      <Dialog
        handle={receiveDialog}
        title="Receive Goods"
        description="Record accepted and rejected quantities for this delivery."
        className="sm:max-w-2xl"
        content={(close) => <ReceiveGoodsDialog purchaseOrder={po} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
