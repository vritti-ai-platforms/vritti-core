import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { PurchaseOrderItem } from '@/db/schema';

export class PurchaseOrderItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  quantity: number;
  receivedQuantity: number;
  supplierUnitPrice: CurrencyAmountDto;
  unitPrice: CurrencyAmountDto;
  totalPrice: CurrencyAmountDto;

  static from(
    entity: PurchaseOrderItem,
    itemName?: string | null,
    poCurrencyCode?: string | null,
    supplierCurrencyCode?: string | null,
  ): PurchaseOrderItemDto {
    const dto = new PurchaseOrderItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? '';
    dto.uomId = entity.uomId;
    dto.quantity = Number(entity.quantity);
    dto.receivedQuantity = Number(entity.receivedQuantity);

    const poCode = poCurrencyCode ?? 'USD';
    const supplierCode = supplierCurrencyCode ?? poCode;

    dto.supplierUnitPrice = CurrencyAmountDto.from(entity.supplierUnitPrice, supplierCode);
    dto.unitPrice = CurrencyAmountDto.from(entity.unitPrice, poCode);
    dto.totalPrice = CurrencyAmountDto.from(entity.totalPrice, poCode);

    return dto;
  }
}
