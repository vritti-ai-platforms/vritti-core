import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseOrderItem } from '@/db/schema';

export class PurchaseOrderItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomQty: number;
  receivedQuantity: number;
  primaryUomQty: number;
  primaryUomSymbol: string | null;
  orderUomSymbol: string | null;
  currencyCode: string;
  unitPrice: CurrencyAmountDto;
  primaryUomUnitPrice: CurrencyAmountDto;
  totalPrice: CurrencyAmountDto;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  freeQty: number;

  static from(
    entity: PurchaseOrderItem & { orderUomSymbol?: string | null; primaryUomSymbol?: string | null },
    itemName?: string | null,
  ): PurchaseOrderItemDto {
    const dto = new PurchaseOrderItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? '';
    dto.uomId = entity.uomId;
    dto.uomQty = entity.uomQty;
    dto.receivedQuantity = entity.receivedQuantity;
    dto.primaryUomQty = entity.primaryUomQty;
    dto.orderUomSymbol = entity.orderUomSymbol ?? null;
    dto.primaryUomSymbol = entity.primaryUomSymbol ?? null;
    dto.currencyCode = entity.currencyCode;

    dto.unitPrice = CurrencyAmountDto.from(entity.unitPrice, entity.currencyCode);
    dto.primaryUomUnitPrice = CurrencyAmountDto.from(entity.primaryUomUnitPrice, entity.currencyCode);
    dto.totalPrice = CurrencyAmountDto.from(entity.totalPrice, entity.currencyCode);

    dto.schemeBuyQty = entity.schemeBuyQty ?? null;
    dto.schemeFreeQty = entity.schemeFreeQty ?? null;
    dto.hasScheme = entity.hasScheme;
    dto.freeQty = entity.freeQty ?? 0;

    return dto;
  }
}
