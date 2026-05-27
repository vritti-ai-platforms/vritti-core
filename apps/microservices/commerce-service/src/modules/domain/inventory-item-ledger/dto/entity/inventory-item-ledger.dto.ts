import type { InventoryItemLedgerEntry, InventoryItemLedgerType } from '@/db/schema';

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

  static from(entry: InventoryItemLedgerEntry, itemName?: string | null): InventoryItemLedgerDto {
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
    return dto;
  }
}
