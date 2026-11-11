import { SITE_ORDERS } from '@vritti/commerce-permissions/orders';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useConfirm, useFormatters } from '@vritti/quantum-ui/hooks';
import { CreditCard, RefreshCw, Undo2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useCheckOrderPaymentRefund, useOrderPayments, useRefundOrderPayment } from '@/hooks/site/orders';
import type { OrderPayment } from '@/schemas/orders';
import { gatewayName, ORDER_PAYMENT_STATUS } from '../components/order-payment-labels';

interface PaymentsTabProps {
  orderId: string;
}

// Every payment of the order's checkout: the one the order was paid with, and any second payment a shopper made, which
// is refunded automatically. Staff act in two cases: a refund still pending can be checked with the gateway without
// waiting for its webhook, and a refund the gateway refused can be retried
export const PaymentsTab = ({ orderId }: PaymentsTabProps) => {
  const paymentsQuery = useOrderPayments(orderId);
  const refund = useRefundOrderPayment();
  const check = useCheckOrderPaymentRefund();
  const confirm = useConfirm();
  const fmt = useFormatters();
  const busy = refund.isPending || check.isPending;

  const handleRetry = useCallback(
    async (payment: OrderPayment) => {
      const confirmed = await confirm({
        title: 'Try the refund again?',
        description: `${fmt.currency(payment.amount).primary} goes back to the shopper through ${gatewayName(payment.gatewayCode)}${payment.providerPaymentId ? ` (${payment.providerPaymentId})` : ''}. The order keeps the payment it was paid with.`,
        confirmLabel: 'Retry refund',
        variant: 'destructive',
      });
      if (confirmed) refund.mutate({ id: orderId, paymentIntentId: payment.id });
    },
    [confirm, fmt, refund, orderId],
  );

  const columns = useMemo<ColumnDef<OrderPayment>[]>(
    () => [
      {
        accessorKey: 'gatewayCode',
        header: 'Gateway',
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{gatewayName(row.original.gatewayCode)}</span>
            {row.original.method && <p className="text-muted-foreground text-xs capitalize">{row.original.method}</p>}
          </div>
        ),
      },
      {
        accessorKey: 'providerPaymentId',
        header: 'Payment',
        cell: ({ row }) => <StringCell value={row.original.providerPaymentId} mono />,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <div>
            <CurrencyCell value={row.original.amount} />
            {/* A checkout across stores is paid once: the amount is the whole payment, not this order's */}
            {row.original.coversOtherOrders && (
              <p className="text-muted-foreground text-xs">Includes other stores’ orders</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const payment = row.original;
          const status = ORDER_PAYMENT_STATUS[payment.status];
          return (
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={status.variant} className={status.className}>
                  {status.label}
                </Badge>
                {payment.usedForOrder && <Badge variant="outline">Used for order</Badge>}
                {!payment.usedForOrder && payment.status === 'SUCCEEDED' && (
                  <Badge variant="outline">Not used — refunding automatically</Badge>
                )}
              </div>
              {payment.refundReference && (
                <p className="mt-1 text-muted-foreground text-xs">
                  Refund <StringCell value={payment.refundReference} mono />
                </p>
              )}
              {payment.status === 'REFUND_FAILED' && payment.refundFailureMessage && (
                <p className="mt-1 text-destructive text-xs">{payment.refundFailureMessage}</p>
              )}
            </div>
          );
        },
      },
      {
        id: 'when',
        header: 'When',
        cell: ({ row }) => (
          <DateTimeCell value={row.original.refundedAt ?? row.original.succeededAt ?? row.original.createdAt} />
        ),
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              // Gone once the refund settles, whichever of the webhook, the sweep or this check gets there
              {
                id: 'check',
                icon: RefreshCw,
                label: 'Check status',
                hidden: row.original.status !== 'REFUND_PENDING',
                disabled: busy,
                onClick: () => check.mutate({ id: orderId, paymentIntentId: row.original.id }),
              },
              {
                id: 'retry',
                icon: Undo2,
                label: 'Retry refund',
                variant: 'destructive',
                permission: SITE_ORDERS.payments.refund,
                hidden: !row.original.refundable,
                disabled: busy,
                onClick: () => handleRetry(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [busy, check, orderId, handleRetry],
  );

  const paymentsTable = useDataTable({
    columns,
    query: {
      data: { result: paymentsQuery.data ?? [], count: paymentsQuery.data?.length ?? 0 },
      isLoading: paymentsQuery.isLoading,
    },
    slug: 'commerce-site-order-payments',
    label: 'payment',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={paymentsTable}
      mode="tab"
      permission={SITE_ORDERS.payments.view}
      emptyStateConfig={{
        icon: CreditCard,
        title: 'No online payments',
        description: 'Payments taken through a gateway for this order appear here.',
      }}
    />
  );
};
