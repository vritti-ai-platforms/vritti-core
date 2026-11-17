import type { AllocationWithLegRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import Decimal from '@vritti/api-sdk/decimal';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { InventoryTrackingValues, type PurchaseType } from '@/db/schema';

export class ReceiveWithInvoiceOpenLineDto {
  allocationId: string;
  purchaseId: string;
  purchaseNumber: string;
  purchaseSupplierId: string;
  legType: PurchaseType;
  inventoryItemId: string;
  inventoryItemName: string;
  isLotTracked: boolean;
  uomId: string;
  uomSymbol: string;
  primaryUomSymbol: string;
  allocatedQty: number;
  receivedQty: number;
  openQty: number;
  unitPrice: CurrencyAmountDto;
  isPriced: boolean;
  purchaseOrderItemId: string | null;
  // Why receiving it is refused: it has no purchase order line yet, so receiving would order an item the site has blocked
  // buying; null when it may be received
  orderBlockedReason: string | null;

  // Shapes an allocation an invoice may receive, its quantities in the allocation's unit: open is what is allocated less what
  // is received and what other draft invoices carry (given in primary units)
  static from(row: AllocationWithLegRow, pendingPrimaryQty: number): ReceiveWithInvoiceOpenLineDto {
    const inUnit = (primaryQty: Decimal.Value) =>
      new Decimal(primaryQty).times(row.uomQty).dividedBy(row.primaryUomQty).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
    const received = inUnit(row.receivedPrimaryQty ?? 0);
    const dto = new ReceiveWithInvoiceOpenLineDto();
    dto.allocationId = row.id;
    dto.purchaseId = row.purchaseId;
    dto.purchaseNumber = row.purchaseNumber;
    dto.purchaseSupplierId = row.purchaseSupplierId;
    dto.legType = row.legType;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.isLotTracked = ReceiveWithInvoiceOpenLineDto.isLotTracked(row);
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.allocatedQty = row.uomQty;
    dto.receivedQty = received.toNumber();
    dto.openQty = Decimal.max(0, new Decimal(row.uomQty).minus(received).minus(inUnit(pendingPrimaryQty))).toNumber();
    dto.unitPrice = CurrencyAmountDto.from(row.unitPrice ?? 0n, row.currencyCode);
    dto.isPriced = row.unitPrice !== null;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.orderBlockedReason = row.purchaseOrderItemId === null ? row.purchasingBlockedReason : null;
    return dto;
  }

  // Whether an allocation's item is received in lots, so its invoice lines carry a batch
  static isLotTracked(row: Pick<AllocationWithLegRow, 'tracking'>): boolean {
    return row.tracking === InventoryTrackingValues.LOT || row.tracking === InventoryTrackingValues.LOT_SERIAL;
  }
}
