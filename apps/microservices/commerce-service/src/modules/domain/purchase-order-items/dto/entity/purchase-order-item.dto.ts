import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { PurchaseOrderItem } from '@/db/schema';

export class PurchaseOrderItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  quantity: number;
  receivedQuantity: number;
  conversionFactor: number;
  primaryUomSymbol: string | null;
  supplierUnitPrice: CurrencyAmountDto;
  unitPrice: CurrencyAmountDto;
  primaryUomUnitPrice: CurrencyAmountDto;
  totalPrice: CurrencyAmountDto;

  orderUomSymbol: string | null;
  primaryUomSupplierUnitPrice: CurrencyAmountDto;

  static from(
    entity: PurchaseOrderItem & { orderUomSymbol?: string | null; primaryUomSymbol?: string | null },
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
    dto.conversionFactor = Number(entity.conversionFactor);
    dto.orderUomSymbol = entity.orderUomSymbol ?? null;
    dto.primaryUomSymbol = entity.primaryUomSymbol ?? null;

    const poCode = poCurrencyCode ?? 'USD';
    const supplierCode = supplierCurrencyCode ?? poCode;

    dto.supplierUnitPrice = CurrencyAmountDto.from(entity.supplierUnitPrice, supplierCode);
    const primarySupplierMinor = BigInt(Math.round(Number(entity.supplierUnitPrice) / Number(entity.conversionFactor)));
    dto.primaryUomSupplierUnitPrice = CurrencyAmountDto.from(primarySupplierMinor, supplierCode);
    dto.unitPrice = CurrencyAmountDto.from(entity.unitPrice, poCode);
    dto.primaryUomUnitPrice = CurrencyAmountDto.from(entity.primaryUomUnitPrice, poCode);
    dto.totalPrice = CurrencyAmountDto.from(entity.totalPrice, poCode);

    return dto;
  }
}
