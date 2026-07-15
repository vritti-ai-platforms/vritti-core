import { Injectable } from '@nestjs/common';
import type { InventoryItemMrp } from '@/db/schema';
import { InventoryItemMrpsRepository } from '../repositories/inventory-item-mrps.repository';

@Injectable()
export class InventoryItemMrpsService {
  constructor(private readonly repository: InventoryItemMrpsRepository) {}

  // Records the latest suggested MRP for an (item, currency); called when a goods receipt is published.
  upsertForCurrency(
    inventoryItemId: string,
    currencyCode: string,
    amount: bigint,
    sourceLotId: string | null,
  ): Promise<InventoryItemMrp> {
    return this.repository.upsertForCurrency(inventoryItemId, currencyCode, amount, sourceLotId);
  }

  // Returns the suggested MRPs for an inventory item (one per currency)
  findByItem(inventoryItemId: string): Promise<InventoryItemMrp[]> {
    return this.repository.findByItem(inventoryItemId);
  }
}
