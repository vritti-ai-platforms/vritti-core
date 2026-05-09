import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle, ChefHat, PackageCheck, ThumbsUp, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useOrder } from '@/hooks/orders';
import { useUpdateOrderStatus } from '@/hooks/orders';
import type { OrderChannel, OrderStatus, OrderType } from '@/schemas/orders';

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  ACCEPTED: { label: 'Accepted', variant: 'secondary' },
  PREPARING: { label: 'Preparing', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  READY: { label: 'Ready', variant: 'secondary', className: 'bg-success/15 text-success' },
  COMPLETED: { label: 'Completed', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const typeLabels: Record<OrderType, string> = {
  DINE_IN: 'Dine In',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery',
};

const channelLabels: Record<OrderChannel, string> = {
  ONLINE: 'Online',
  WALK_IN: 'Walk-in',
};

const nextStatusActions: Partial<
  Record<OrderStatus, { label: string; status: OrderStatus; icon: typeof CheckCircle }>
> = {
  PENDING: { label: 'Accept', status: 'ACCEPTED', icon: ThumbsUp },
  ACCEPTED: { label: 'Start Preparing', status: 'PREPARING', icon: ChefHat },
  PREPARING: { label: 'Mark Ready', status: 'READY', icon: PackageCheck },
  READY: { label: 'Complete', status: 'COMPLETED', icon: CheckCircle },
};

export const OrderDetailPage = () => {
  const { id } = useSlugParams('orderSlug');
  const { data: order, isLoading, refetch } = useOrder(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const statusMutation = useUpdateOrderStatus();
  const confirm = useConfirm();

  const handleStatusChange = useCallback(
    async (nextStatus: OrderStatus, label: string) => {
      if (!id) return;
      const confirmed = await confirm({
        title: `${label}?`,
        description: `This will change the order status to "${statusConfig[nextStatus].label}".`,
        confirmLabel: label,
        variant: nextStatus === 'CANCELLED' ? 'destructive' : undefined,
      });
      if (confirmed) {
        statusMutation.mutate({ id, status: nextStatus }, { onSuccess: () => refetch() });
      }
    },
    [id, confirm, statusMutation, refetch],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Order not found.</div>;
  }

  const badgeConfig = statusConfig[order.status];
  const nextAction = nextStatusActions[order.status];
  const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={order.orderNumber}
        description={`${typeLabels[order.type]} - ${channelLabels[order.channel]}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
              {badgeConfig.label}
            </Badge>
            {nextAction && (
              <Button
                size="sm"
                startAdornment={<nextAction.icon className="size-4" />}
                onClick={() => handleStatusChange(nextAction.status, nextAction.label)}
              >
                {nextAction.label}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                startAdornment={<XCircle className="size-4" />}
                onClick={() => handleStatusChange('CANCELLED', 'Cancel Order')}
              >
                Cancel
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
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Order Number</p>
                        <p className="mt-1 font-mono font-medium">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant="outline" className="mt-1">
                          {typeLabels[order.type]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Channel</p>
                        <p className="mt-1">{channelLabels[order.channel]}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Placed At</p>
                        <p className="mt-1"><FormattedDate value={order.placedAt} /></p>
                      </div>
                      {order.externalOrderId && (
                        <div>
                          <p className="text-sm text-muted-foreground">External ID</p>
                          <p className="mt-1 font-mono text-xs">{order.externalOrderId}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="mt-1">{order.notes ?? '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="mt-1 font-medium">{order.customerName ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="mt-1">{order.customerPhone ?? '—'}</p>
                      </div>
                      {order.deliveryAddress && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Delivery Address</p>
                          <p className="mt-1">{order.deliveryAddress}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Amount Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-mono">{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-mono">{order.taxAmount.toFixed(2)}</span>
                      </div>
                      {order.serviceCharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Charge</span>
                          <span className="font-mono">{order.serviceCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {order.deliveryCharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Charge</span>
                          <span className="font-mono">{order.deliveryCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-mono text-success">-{order.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Total</span>
                        <span className="font-mono">{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: 'items',
            label: `Items (${order.items.length})`,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.items.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">No items in this order.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">#</th>
                            <th className="pb-2 font-medium">Item</th>
                            <th className="pb-2 font-medium text-right">Qty</th>
                            <th className="pb-2 font-medium text-right">Unit Price</th>
                            <th className="pb-2 font-medium text-right">Tax</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, index) => (
                            <>
                              <tr key={item.id} className="border-b last:border-0">
                                <td className="py-3 text-muted-foreground">{index + 1}</td>
                                <td className="py-3">
                                  <div>
                                    <span className="font-medium">{item.itemName}</span>
                                    {item.variantName && (
                                      <span className="ml-1 text-muted-foreground">({item.variantName})</span>
                                    )}
                                  </div>
                                  {item.notes && <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p>}
                                </td>
                                <td className="py-3 text-right font-mono">{item.quantity}</td>
                                <td className="py-3 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                                <td className="py-3 text-right font-mono">{item.taxAmount.toFixed(2)}</td>
                                <td className="py-3 text-right font-mono">{item.total.toFixed(2)}</td>
                              </tr>
                              {item.modifiers.length > 0 && (
                                <tr key={`${item.id}-mods`}>
                                  <td />
                                  <td colSpan={5} className="pb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {item.modifiers.map((mod) => (
                                        <Badge key={mod.id} variant="outline" className="text-xs">
                                          {mod.name}
                                          {mod.additionalPrice > 0 && (
                                            <span className="ml-1 text-muted-foreground">
                                              +{mod.additionalPrice.toFixed(2)}
                                            </span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
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
    </div>
  );
};
