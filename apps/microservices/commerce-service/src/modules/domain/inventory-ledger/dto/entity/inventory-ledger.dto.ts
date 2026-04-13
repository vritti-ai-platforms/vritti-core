import type { InventoryLedgerEntry, InventoryLedgerType } from '@/db/schema';

export class InventoryLedgerDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  batchId: string | null;
  batchNumber: string | null;
  type: InventoryLedgerType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;

  static from(entry: InventoryLedgerEntry, itemName?: string | null, batchNumber?: string | null): InventoryLedgerDto {
    const dto = new InventoryLedgerDto();
    dto.id = entry.id;
    dto.inventoryItemId = entry.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.batchId = entry.batchId ?? null;
    dto.batchNumber = batchNumber ?? null;
    dto.type = entry.type;
    dto.quantity = Number(entry.quantity);
    dto.referenceType = entry.referenceType ?? null;
    dto.referenceId = entry.referenceId ?? null;
    dto.notes = entry.notes ?? null;
    dto.createdAt = entry.createdAt.toISOString();
    return dto;
  }
}
