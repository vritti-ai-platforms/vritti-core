import { type CurrencyAmountDto, type CurrencyCode, minorToMajor } from '@vritti/api-sdk';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/db/schema';

export class PurchaseOrderItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  uomId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  conversionRate: number;
  itemCurrencyCode: string;
  supplierUnitPrice: CurrencyAmountDto;
  unitPrice: CurrencyAmountDto;
  totalPrice: CurrencyAmountDto;

  static from(
    entity: PurchaseOrderItem,
    itemName?: string | null,
    poCurrencyCode?: string | null,
  ): PurchaseOrderItemDto {
    const dto = new PurchaseOrderItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.uomId = entity.uomId;
    dto.orderedQuantity = Number(entity.orderedQuantity);
    dto.receivedQuantity = Number(entity.receivedQuantity);
    dto.conversionRate = Number(entity.conversionRate);
    dto.itemCurrencyCode = entity.itemCurrencyCode;

    const supplierCode = entity.itemCurrencyCode as CurrencyCode;
    const poCode = (poCurrencyCode ?? 'USD') as CurrencyCode;

    dto.supplierUnitPrice = {
      currency: supplierCode,
      value: minorToMajor(BigInt(entity.supplierUnitPrice), supplierCode) as string,
    };
    dto.unitPrice = { currency: poCode, value: minorToMajor(BigInt(entity.unitPrice), poCode) as string };
    dto.totalPrice = { currency: poCode, value: minorToMajor(BigInt(entity.totalPrice), poCode) as string };

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
  timezone: string;
  notes: string | null;
  totalAmount: CurrencyAmountDto | null;
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
    dto.timezone = entity.timezone;
    dto.notes = entity.notes ?? null;
    dto.totalAmount =
      entity.totalAmount != null
        ? {
            currency: entity.currencyCode,
            value: minorToMajor(BigInt(entity.totalAmount), entity.currencyCode as CurrencyCode) as string,
          }
        : null;
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
