import type { DisplayUnitRatios, InventoryItemLedgerType } from '@/db/schema';
import type { InventoryItemLedgerRow } from '../../repositories/inventory-item-ledger.repository';

export class InventoryItemLedgerDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  type: InventoryItemLedgerType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  displayUnitRatios: DisplayUnitRatios;

  static from(entry: InventoryItemLedgerRow, itemName?: string | null): InventoryItemLedgerDto {
    const dto = new InventoryItemLedgerDto();
    dto.id = entry.id;
    dto.inventoryItemId = entry.inventoryItemId;
    dto.inventoryItemName = itemName ?? '';
    dto.type = entry.type;
    dto.quantity = entry.quantity;
    dto.referenceType = entry.referenceType ?? null;
    dto.referenceId = entry.referenceId ?? null;
    dto.notes = entry.notes ?? null;
    dto.createdAt = entry.createdAt.toISOString();
    dto.displayUnitRatios = entry.displayUnitRatios;
    return dto;
  }
}
