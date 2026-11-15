import Decimal from '@vritti/api-sdk/decimal';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseAllocationRow } from '../../repositories/purchase-item-allocations.repository';

export class PurchaseAllocationDto {
  id: string;
  purchaseItemId: string;
  purchaseSupplierId: string;
  inventoryItemName: string;
  supplierQuotationItemId: string | null;
  quotationNumber: string | null;
  uomId: string;
  uomSymbol: string | null;
  uomQty: number;
  primaryUomQty: number;
  unitPrice: CurrencyAmountDto;
  isPriced: boolean;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  freePrimaryQty: number;
  purchaseOrderItemId: string | null;
  purchaseOrderId: string | null;
  openForInboundDeliveryQty: number;

  // Shapes an allocation; a direct purchase that leaves its price to the invoice shows a zero price, not priced. What its
  // confirmed PO line has not yet put on a delivery is given in primary units and shown in the allocation's unit
  static from(row: PurchaseAllocationRow, openForInboundDeliveryPrimaryQty = 0): PurchaseAllocationDto {
    const dto = new PurchaseAllocationDto();
    dto.id = row.id;
    dto.purchaseItemId = row.purchaseItemId;
    dto.purchaseSupplierId = row.purchaseSupplierId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.supplierQuotationItemId = row.supplierQuotationItemId;
    dto.quotationNumber = row.quotationNumber;
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.uomQty = row.uomQty;
    dto.primaryUomQty = row.primaryUomQty;
    dto.unitPrice = CurrencyAmountDto.from(row.unitPrice ?? 0n, row.currencyCode);
    dto.isPriced = row.unitPrice !== null;
    dto.schemeBuyQty = row.schemeBuyQty;
    dto.schemeFreeQty = row.schemeFreeQty;
    dto.hasScheme = row.hasScheme;
    dto.freePrimaryQty = row.freePrimaryQty;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.openForInboundDeliveryQty = new Decimal(openForInboundDeliveryPrimaryQty)
      .times(row.uomQty)
      .dividedBy(row.primaryUomQty)
      .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
      .toNumber();
    return dto;
  }
}
