import { Injectable, Logger } from '@nestjs/common';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import type { InventoryItemSite } from '@/db/schema';
import { InventoryItemSitesRepository } from '../repositories/inventory-item-sites.repository';

@Injectable()
export class InventoryItemSitesService {
  private readonly logger = new Logger(InventoryItemSitesService.name);

  constructor(private readonly repository: InventoryItemSitesRepository) {}

  // Enables an item at the current site by inserting its projection row
  async enable(
    inventoryItemId: string,
    siteId: string,
    data?: { reorderPoint?: number; maxStockLevel?: number; safetyStock?: number },
  ): Promise<InventoryItemSite> {
    const existing = await this.repository.findByCompositeKey(inventoryItemId, siteId);
    if (existing) throw new ConflictException('This item is already enabled at this site.');
    const entity = await this.repository.create({
      inventoryItemId,
      ...(data?.reorderPoint !== undefined ? { reorderPoint: data.reorderPoint } : {}),
      ...(data?.maxStockLevel !== undefined ? { maxStockLevel: data.maxStockLevel } : {}),
      ...(data?.safetyStock !== undefined ? { safetyStock: data.safetyStock } : {}),
    });
    this.logger.log(`Enabled inventory item ${inventoryItemId} at site ${siteId}`);
    return entity;
  }

  // Updates the reorder point for an item at the current site
  async updateReorder(inventoryItemId: string, siteId: string, reorderPoint: number): Promise<void> {
    await this.repository.updateReorder(inventoryItemId, siteId, reorderPoint);
    this.logger.log(`Updated reorder point for item ${inventoryItemId} at site ${siteId} — ${reorderPoint}`);
  }

  // Returns every projection row for the current site
  findBySite(siteId: string): Promise<InventoryItemSite[]> {
    return this.repository.findBySite(siteId);
  }

  // Returns every projection row for a given item
  findByItem(inventoryItemId: string): Promise<InventoryItemSite[]> {
    return this.repository.findByItem(inventoryItemId);
  }

  // Returns true when the item has a projection row at the given site
  async isEnabled(inventoryItemId: string, siteId: string): Promise<boolean> {
    const existing = await this.repository.findByCompositeKey(inventoryItemId, siteId);
    return existing != null;
  }
}
