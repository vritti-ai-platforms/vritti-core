import type { OrderChannel, OrderStatus, OrderType } from '@/schemas/orders';

export const ORDER_STATUS: Record<
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

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DINE_IN: 'Dine In',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery',
};

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  ONLINE: 'Online',
  WALK_IN: 'Walk-in',
};
