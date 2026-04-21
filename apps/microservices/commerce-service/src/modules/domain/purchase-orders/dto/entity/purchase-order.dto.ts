import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/db/schema';

export class PurchaseOrderItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  supplierUnitPrice: number;
  unitPrice: number | null;
  totalPrice: number | null;

  static from(entity: PurchaseOrderItem, itemName?: string | null): PurchaseOrderItemDto {
    const dto = new PurchaseOrderItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.orderedQuantity = Number(entity.orderedQuantity);
    dto.receivedQuantity = Number(entity.receivedQuantity);
    dto.supplierUnitPrice = Number(entity.supplierUnitPrice);
    dto.unitPrice = entity.unitPrice ? Number(entity.unitPrice) : null;
    dto.totalPrice = entity.totalPrice ? Number(entity.totalPrice) : null;
    return dto;
  }
}

export class PurchaseOrderDto {
  id: string;
  supplierId: string;
  supplierName: string | null;
  supplierCurrencyCode: string | null;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  conversionRate: number;
  orderDate: string;
  expectedBy: string | null;
  notes: string | null;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;

  static from(entity: PurchaseOrder, supplierName?: string | null, supplierCurrencyCode?: string | null): PurchaseOrderDto {
    const dto = new PurchaseOrderDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.supplierName = supplierName ?? null;
    dto.supplierCurrencyCode = supplierCurrencyCode ?? null;
    dto.poNumber = entity.poNumber;
    dto.status = entity.status;
    dto.currencyCode = entity.currencyCode;
    dto.conversionRate = Number(entity.conversionRate);
    dto.orderDate = entity.orderDate;
    dto.expectedBy = entity.expectedBy ?? null;
    dto.notes = entity.notes ?? null;
    dto.totalAmount = entity.totalAmount ? Number(entity.totalAmount) : null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class PurchaseOrderDetailDto extends PurchaseOrderDto {
  items: PurchaseOrderItemDto[];

  static fromDetail(
    entity: PurchaseOrder,
    supplierName: string | null,
    items: PurchaseOrderItemDto[],
  ): PurchaseOrderDetailDto {
    const dto = new PurchaseOrderDetailDto();
    Object.assign(dto, PurchaseOrderDto.from(entity, supplierName));
    dto.items = items;
    return dto;
  }
}
