import type { Order } from '@/db/schema';
import { OrderItemDto } from './order-item.dto';

export class OrderDto {
  id: string;
  organizationId: string;
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
  items: OrderItemDto[];

  // Creates a DTO from an Order entity with optional items
  static from(order: Order, items: OrderItemDto[] = []): OrderDto {
    const dto = new OrderDto();
    dto.id = order.id;
    dto.organizationId = order.organizationId;
    dto.businessUnitId = order.businessUnitId;
    dto.orderNumber = order.orderNumber;
    dto.source = order.source;
    dto.status = order.status;
    dto.customerId = order.customerId ?? null;
    dto.customerPhone = order.customerPhone ?? null;
    dto.voopOrderId = order.voopOrderId ?? null;
    dto.subtotal = order.subtotal;
    dto.tax = order.tax;
    dto.discount = order.discount;
    dto.total = order.total;
    dto.notes = order.notes ?? null;
    dto.paymentMethod = order.paymentMethod;
    dto.paidAt = order.paidAt ? order.paidAt.toISOString() : null;
    dto.createdBy = order.createdBy ?? null;
    dto.createdAt = order.createdAt.toISOString();
    dto.updatedAt = order.updatedAt.toISOString();
    dto.items = items;
    return dto;
  }
}
