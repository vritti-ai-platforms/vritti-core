import { z } from 'zod/v4';

export type OrderSource = 'ONLINE' | 'WALK_IN';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'UNPAID';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
  notes: string | null;
  stationId: string | null;
  kotNumber: number | null;
  status: string;
  createdAt: string;
}

export interface Order {
  id: string;
  businessUnitId: string;
  orderNumber: string;
  source: string;
  status: string;
  customerId: string | null;
  customerPhone: string | null;
  voopOrderId: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  notes: string | null;
  paymentMethod: string;
  paidAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export const createOrderItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price must be positive'),
  notes: z.string().optional(),
  stationId: z.string().optional(),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

export const createOrderSchema = z.object({
  source: z.enum(['ONLINE', 'WALK_IN']),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'WALLET', 'UNPAID']),
  items: z.array(createOrderItemSchema).min(1, 'At least one item is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
