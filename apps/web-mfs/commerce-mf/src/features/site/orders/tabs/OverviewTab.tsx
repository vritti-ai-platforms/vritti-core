import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type { OrderDetail } from '@/schemas/orders';
import { OrderAmount } from '../components/OrderAmount';
import { ORDER_CHANNEL_LABELS, ORDER_TYPE_LABELS } from '../components/order-labels';

interface OverviewTabProps {
  order: OrderDetail;
}

// The order at a glance: what it is, who it is for, and how its total is made up
export const OverviewTab = ({ order }: OverviewTabProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Order Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <DetailField label="Order Number" type="string" mono value={order.orderNumber} />
          <DetailField
            label="Type"
            type="string"
            value={<Badge variant="outline">{ORDER_TYPE_LABELS[order.type]}</Badge>}
          />
          <DetailField label="Channel" type="string" value={ORDER_CHANNEL_LABELS[order.channel]} />
          <DetailField label="Placed At" type="dateTime" value={order.placedAt} />
          <DetailField label="Notes" type="string" value={order.notes} className="col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <DetailField label="Name" type="string" value={order.customerName} />
          <DetailField label="Phone" type="string" value={order.customerPhone} />
          {order.deliveryAddress && (
            <DetailField label="Delivery Address" type="string" value={order.deliveryAddress} className="col-span-2" />
          )}
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
              <span className="font-mono">
                <OrderAmount minor={order.subtotal} currencyCode={order.currencyCode} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-mono">
                <OrderAmount minor={order.taxAmount} currencyCode={order.currencyCode} />
              </span>
            </div>
            {BigInt(order.serviceCharge) > 0n && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge</span>
                <span className="font-mono">
                  <OrderAmount minor={order.serviceCharge} currencyCode={order.currencyCode} />
                </span>
              </div>
            )}
            {BigInt(order.deliveryCharge) > 0n && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge</span>
                <span className="font-mono">
                  <OrderAmount minor={order.deliveryCharge} currencyCode={order.currencyCode} />
                </span>
              </div>
            )}
            {BigInt(order.discountAmount) > 0n && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-mono text-success">
                  -<OrderAmount minor={order.discountAmount} currencyCode={order.currencyCode} />
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Total</span>
              <span className="font-mono">
                <OrderAmount minor={order.totalAmount} currencyCode={order.currencyCode} />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
