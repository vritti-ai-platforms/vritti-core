import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const zOptionalNonNegativeNumber = z.number().nonnegative().optional().catch(undefined);

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderChannel = 'ONLINE' | 'WALK_IN';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

// Money fields below are bigint minor units serialized as strings — feed straight into
// formatCurrency() / minorToMajor(). For arithmetic, parse with BigInt(...).
export interface OrderItemModifierData {
  id: string;
  name: string;
  additionalPrice: string;
}

export interface OrderItemData {
  id: string;
  itemName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  taxRate: number;
  taxAmount: string;
  subtotal: string;
  total: string;
  notes: string | null;
  modifiers: OrderItemModifierData[];
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
  placedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends OrderData {
  items: OrderItemData[];
  deliveryAddress: string | null;
  notes: string | null;
  externalOrderId: string | null;
  confirmedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export type OrdersTableResponse = TableResponse<OrderData>;

const orderItemModifierSchema = z.object({
  modifierGroupId: z.string().min(1),
  modifierOptionId: z.string().min(1),
  name: z.string().min(1),
  additionalPrice: z.number(),
});

const orderItemSchema = z.object({
  offeringVariantId: z.string().min(1, 'Variant is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
  modifiers: z.array(orderItemModifierSchema).optional(),
});

export const createOrderSchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY'], { message: 'Order type is required' }),
  channel: z.enum(['ONLINE', 'WALK_IN'], { message: 'Channel is required' }),
  channelId: z.string().optional(),
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
