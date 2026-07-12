import type { PurchaseOrderStatus } from '@/schemas/purchase-orders';

export const purchaseOrderStatusConfig: Record<
  PurchaseOrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'outline' },
  APPROVED: { label: 'Approved', variant: 'secondary' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  DRAFT: { label: 'Draft', variant: 'outline' },
  SENT: { label: 'Sent', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary', className: 'bg-success/15 text-success' },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  RECEIVED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  CLOSED: { label: 'Closed', variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const nextPurchaseOrderStatusAction: Partial<
  Record<PurchaseOrderStatus, { label: string; status: PurchaseOrderStatus }>
> = {
  DRAFT: { label: 'Mark as Sent', status: 'SENT' },
  SENT: { label: 'Confirm Purchase Order', status: 'CONFIRMED' },
};
