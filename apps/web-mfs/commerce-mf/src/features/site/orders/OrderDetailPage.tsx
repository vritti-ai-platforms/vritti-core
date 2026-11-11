import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle, ChefHat, PackageCheck, ThumbsUp, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useOrder, useUpdateOrderStatus } from '@/hooks/site/orders';
import type { OrderStatus } from '@/schemas/orders';
import { OrderAttentionAlerts } from './components/OrderAttentionAlerts';
import { ORDER_CHANNEL_LABELS, ORDER_STATUS, ORDER_TYPE_LABELS } from './components/order-labels';
import { ItemsTab } from './tabs/ItemsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PaymentsTab } from './tabs/PaymentsTab';

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
  const { data: order } = useOrder(id);
  const [activeTab, setActiveTab] = useState('overview');
  const statusMutation = useUpdateOrderStatus();
  const confirm = useConfirm();

  const handleStatusChange = useCallback(
    async (nextStatus: OrderStatus, label: string) => {
      const confirmed = await confirm({
        title: `${label}?`,
        description: `This will change the order status to "${ORDER_STATUS[nextStatus].label}".`,
        confirmLabel: label,
        variant: nextStatus === 'CANCELLED' ? 'destructive' : undefined,
      });
      if (confirmed) statusMutation.mutate({ id: order.id, status: nextStatus });
    },
    [order.id, confirm, statusMutation],
  );

  const badgeConfig = ORDER_STATUS[order.status];
  const nextAction = nextStatusActions[order.status];
  const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={order.orderNumber}
        description={`${ORDER_TYPE_LABELS[order.type]} - ${ORDER_CHANNEL_LABELS[order.channel]}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
              {badgeConfig.label}
            </Badge>
            {nextAction && (
              <Button
                size="sm"
                permission={SITE_ORDERS.edit}
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
                permission={SITE_ORDERS.edit}
                startAdornment={<XCircle className="size-4" />}
                onClick={() => handleStatusChange('CANCELLED', 'Cancel Order')}
              >
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <OrderAttentionAlerts order={order} />

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', content: <OverviewTab order={order} /> },
          { value: 'items', label: `Items (${order.items.length})`, content: <ItemsTab order={order} /> },
          {
            value: 'payments',
            label: 'Payments',
            permission: SITE_ORDERS.payments.view,
            content: <PaymentsTab orderId={order.id} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
