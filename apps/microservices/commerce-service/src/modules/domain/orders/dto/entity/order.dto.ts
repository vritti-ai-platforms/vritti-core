import type { Order, OrderItem, OrderItemModifier } from '@/db/schema';

export class OrderItemModifierDto {
  id: string;
  name: string;
  additionalPrice: number;

  static from(entity: OrderItemModifier): OrderItemModifierDto {
    const dto = new OrderItemModifierDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.additionalPrice = Number(entity.additionalPrice);
    return dto;
  }
}

export class OrderItemDto {
  id: string;
  itemName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  notes: string | null;
  modifiers: OrderItemModifierDto[];

  static from(entity: OrderItem, modifiers: OrderItemModifierDto[] = []): OrderItemDto {
    const dto = new OrderItemDto();
    dto.id = entity.id;
    dto.itemName = entity.itemName;
    dto.variantName = entity.variantName ?? null;
    dto.quantity = entity.quantity;
    dto.unitPrice = Number(entity.unitPrice);
    dto.taxRate = entity.taxRate;
    dto.taxAmount = Number(entity.taxAmount);
    dto.subtotal = Number(entity.subtotal);
    dto.total = Number(entity.total);
    dto.notes = entity.notes ?? null;
    dto.modifiers = modifiers;
    return dto;
  }
}

export class OrderDto {
  id: string;
  orderNumber: string;
  type: string;
  channel: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  placedAt: string;
  createdAt: string;
  updatedAt: string;

  static from(entity: Order): OrderDto {
    const dto = new OrderDto();
    dto.id = entity.id;
    dto.orderNumber = entity.orderNumber;
    dto.type = entity.type;
    dto.channel = entity.channel;
    dto.status = entity.status;
    dto.customerName = entity.customerName ?? null;
    dto.customerPhone = entity.customerPhone ?? null;
    dto.subtotal = Number(entity.subtotal);
    dto.taxAmount = Number(entity.taxAmount);
    dto.serviceCharge = Number(entity.serviceCharge);
    dto.deliveryCharge = Number(entity.deliveryCharge);
    dto.discountAmount = Number(entity.discountAmount);
    dto.totalAmount = Number(entity.totalAmount);
    dto.placedAt = entity.placedAt.toISOString();
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class OrderDetailDto extends OrderDto {
  deliveryAddress: string | null;
  notes: string | null;
  externalOrderId: string | null;
  confirmedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItemDto[];

  static fromDetail(entity: Order, items: OrderItemDto[]): OrderDetailDto {
    const dto = new OrderDetailDto();
    Object.assign(dto, OrderDto.from(entity));
    dto.deliveryAddress = entity.deliveryAddress ?? null;
    dto.notes = entity.notes ?? null;
    dto.externalOrderId = entity.externalOrderId ?? null;
    dto.confirmedAt = entity.confirmedAt?.toISOString() ?? null;
    dto.readyAt = entity.readyAt?.toISOString() ?? null;
    dto.completedAt = entity.completedAt?.toISOString() ?? null;
    dto.cancelledAt = entity.cancelledAt?.toISOString() ?? null;
    dto.cancellationReason = entity.cancellationReason ?? null;
    dto.items = items;
    return dto;
  }
}
