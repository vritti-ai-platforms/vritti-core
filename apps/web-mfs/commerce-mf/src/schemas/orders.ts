import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const zOptionalNonNegativeNumber = z.number().nonnegative().optional().catch(undefined);

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderChannel = 'ONLINE' | 'WALK_IN';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItemData {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  taxRate: number;
  taxAmount: string;
  subtotal: string;
  total: string;
  notes: string | null;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  type: OrderType;
  channel: OrderChannel;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: string;
  taxAmount: string;
  serviceCharge: string;
  deliveryCharge: string;
  discountAmount: string;
  totalAmount: string;
  currencyCode: string;
  // A payment landed after the order or its checkout was cancelled
  needsReview: boolean;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends OrderData {
  items: OrderItemData[];
  deliveryAddress: string | null;
  notes: string | null;
  confirmedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  // The payment the order was paid with, and the checkout it was paid through
  paymentIntentId: string | null;
  checkoutId: string | null;
}

export type OrderPaymentStatus =
  | 'CREATED'
  | 'REQUIRES_ACTION'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'REFUND_FAILED';

// One payment of the order's checkout
export interface OrderPayment {
  id: string;
  gatewayCode: string;
  method: string | null;
  amount: { currency: string; value: string };
  status: OrderPaymentStatus;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  succeededAt: string | null;
  // When the gateway confirmed the refund
  refundedAt: string | null;
  // The gateway's id for the refund, and why it refused the last one
  refundReference: string | null;
  refundFailureMessage: string | null;
  // The payment the order was paid with
  usedForOrder: boolean;
  // Received but used by no order, or its refund failed — staff may refund it
  refundable: boolean;
  // The payment is for more than this order: a checkout across stores is paid once for all of them
  coversOtherOrders: boolean;
  createdAt: string;
}

export type OrdersTableResponse = TableResponse<OrderData>;

const orderItemSchema = z.object({
  offeringVariantId: z.uuid('Variant is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY'], { message: 'Order type is required' }),
  channel: z.enum(['ONLINE', 'WALK_IN'], { message: 'Channel is required' }),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  serviceCharge: zOptionalNonNegativeNumber,
  deliveryCharge: zOptionalNonNegativeNumber,
  discountAmount: zOptionalNonNegativeNumber,
  items: z.array(orderItemSchema).optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
