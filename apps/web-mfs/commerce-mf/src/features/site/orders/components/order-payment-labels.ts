import type { OrderPaymentStatus } from '@/schemas/orders';

const GATEWAY_NAMES: Record<string, string> = {
  razorpay: 'Razorpay',
  'hdfc-razorpay': 'HDFC SmartGateway',
  cashfree: 'Cashfree',
  easebuzz: 'Easebuzz',
};

// The gateway's name as staff know it, or its code for one not listed
export function gatewayName(code: string): string {
  return GATEWAY_NAMES[code] ?? code;
}

export const ORDER_PAYMENT_STATUS: Record<
  OrderPaymentStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  CREATED: { label: 'Opened', variant: 'outline' },
  REQUIRES_ACTION: { label: 'Waiting for payer', variant: 'outline' },
  PROCESSING: { label: 'Processing', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  SUCCEEDED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  CANCELED: { label: 'Cancelled', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
  REFUND_PENDING: { label: 'Refund pending', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  REFUNDED: { label: 'Refunded', variant: 'secondary' },
  REFUND_FAILED: { label: 'Refund failed', variant: 'destructive' },
};
