import type { DisplayUnitRatios } from '@/db/schema';
import type { InventoryItemQuantWithRefs } from '../../repositories/inventory-item-quants.repository';

export class InventoryItemQuantDto {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  lotId: string | null;
  lotNumber: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  displayUnitRatios: DisplayUnitRatios;

  static from(row: InventoryItemQuantWithRefs, canDelete = false): InventoryItemQuantDto {
    const dto = new InventoryItemQuantDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName ?? null;
    dto.locationPath = row.locationPath ?? null;
    dto.lotId = row.lotId ?? null;
    dto.lotNumber = row.lotNumber ?? null;
    dto.quantity = row.quantity;
    dto.reservedQuantity = row.reservedQuantity;
    dto.availableQuantity = row.quantity - row.reservedQuantity;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.canDelete = canDelete;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    dto.displayUnitRatios = row.displayUnitRatios;
    return dto;
  }
}

export class LocationStockDto {
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}
