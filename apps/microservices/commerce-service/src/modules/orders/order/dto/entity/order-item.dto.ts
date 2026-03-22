import type { OrderItem } from '@/db/schema';

export class OrderItemDto {
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

  // Creates a DTO from an OrderItem entity
  static from(item: OrderItem): OrderItemDto {
    const dto = new OrderItemDto();
    dto.id = item.id;
    dto.orderId = item.orderId;
    dto.productId = item.productId ?? null;
    dto.name = item.name;
    dto.quantity = item.quantity;
    dto.unitPrice = item.unitPrice;
    dto.total = item.total;
    dto.notes = item.notes ?? null;
    dto.stationId = item.stationId ?? null;
    dto.kotNumber = item.kotNumber ?? null;
    dto.status = item.status;
    dto.createdAt = item.createdAt.toISOString();
    return dto;
  }
}
