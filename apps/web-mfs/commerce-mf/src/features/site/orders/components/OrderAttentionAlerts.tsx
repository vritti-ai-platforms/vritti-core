import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { Alert } from '@vritti/quantum-ui/Alert';
import { PermissionGate } from '@vritti/quantum-ui/PermissionGate';
import { useOrderPayments } from '@/hooks/site/orders';
import type { OrderDetail } from '@/schemas/orders';

// What on this order needs a person's attention: a payment that arrived after the order or its checkout was cancelled,
// and — for staff who see payments — a second payment being refunded or a refund the gateway refused
export const OrderAttentionAlerts = ({ order }: { order: OrderDetail }) => {
  return (
    <div className="flex flex-col gap-3 empty:hidden">
      <PermissionGate permission={SITE_ORDERS.payments.view} fallback={null}>
        <PaymentAlerts orderId={order.id} />
      </PermissionGate>
      {order.needsReview && (
        <Alert
          variant="warning"
          title="Paid after it was cancelled"
          description="The payment arrived after the order or its checkout was cancelled. Check with the shopper before preparing it."
        />
      )}
    </div>
  );
};

// A second payment is refunded on its own; staff only need to know, unless the gateway refused the refund
const PaymentAlerts = ({ orderId }: { orderId: string }) => {
  const { data: payments } = useOrderPayments(orderId);
  const extra = payments?.filter((payment) => !payment.usedForOrder) ?? [];
  const refunding = extra.filter((payment) => payment.status === 'SUCCEEDED' || payment.status === 'REFUND_PENDING');
  const failed = extra.filter((payment) => payment.status === 'REFUND_FAILED');

  return (
    <>
      {failed.length > 0 && (
        <Alert
          variant="destructive"
          title={failed.length === 1 ? 'A refund failed' : `${failed.length} refunds failed`}
          description="The gateway did not refund the shopper's extra payment. Retry it from the Payments tab, or refund them another way."
        />
      )}
      {refunding.length > 0 && (
        <Alert
          variant="info"
          title="The shopper paid more than once"
          description="The extra payment is being refunded automatically. Its progress is on the Payments tab."
        />
      )}
    </>
  );
};
