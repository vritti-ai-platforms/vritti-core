import { Injectable } from '@nestjs/common';
import type { InventoryItemMrp } from '@/db/schema';
import {
  type InventoryItemMrpWithUom,
  InventoryItemMrpsRepository,
} from '../repositories/inventory-item-mrps.repository';

@Injectable()
export class InventoryItemMrpsService {
  constructor(private readonly repository: InventoryItemMrpsRepository) {}

  // Records the latest suggested MRP for an (item, uom, currency); called when a goods receipt is published.
  upsert(
    inventoryItemId: string,
    uomId: string,
    currencyCode: string,
    amount: bigint,
    sourceLotId: string | null,
  ): Promise<InventoryItemMrp> {
    return this.repository.upsert(inventoryItemId, uomId, currencyCode, amount, sourceLotId);
  }

  // Returns the suggested MRPs for an inventory item (one per uom×currency)
  findByItem(inventoryItemId: string): Promise<InventoryItemMrpWithUom[]> {
    return this.repository.findByItem(inventoryItemId);
  }

  // Returns true when the uom shares the item's primary-uom family
  isUomInItemFamily(inventoryItemId: string, uomId: string): Promise<boolean> {
    return this.repository.isUomInItemFamily(inventoryItemId, uomId);
  }
}
