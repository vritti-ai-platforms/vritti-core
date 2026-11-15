import Decimal from '@vritti/api-sdk/decimal';
import type { PurchaseItemSource } from '@/db/schema';
import type { PurchaseItemRow } from '../../repositories/purchase-items.repository';

export class PurchaseItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemCode: string;
  primaryUomSymbol: string | null;
  primaryQty: number;
  allocatedPrimaryQty: number;
  source: PurchaseItemSource;
  sourceId: string | null;
  neededBy: string | null;
  notes: string | null;

  static from(row: PurchaseItemRow): PurchaseItemDto {
    const dto = new PurchaseItemDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.inventoryItemCode = row.inventoryItemCode;
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.primaryQty = row.primaryQty;
    dto.allocatedPrimaryQty = new Decimal(row.allocatedPrimaryQty).toNumber();
    dto.source = row.source;
    dto.sourceId = row.sourceId;
    dto.neededBy = row.neededBy;
    dto.notes = row.notes;
    return dto;
  }
}
