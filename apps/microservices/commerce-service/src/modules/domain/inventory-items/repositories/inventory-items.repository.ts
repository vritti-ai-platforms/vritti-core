import { Injectable } from '@nestjs/common';
import { type FindForSelectConfig, PrimaryBaseRepository, PrimaryDatabaseService, type SelectQueryResult } from '@vritti/api-sdk';
import { desc, eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItem,
  type InventoryLedgerEntry,
  type InventoryLevel,
  type NewInventoryLedgerEntry,
  type NewInventoryLevel,
  inventoryItems,
  inventoryLedger,
  inventoryLevels,
  uom,
} from '@/db/schema';

@Injectable()
export class InventoryItemsRepository extends PrimaryBaseRepository<typeof inventoryItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItems);
  }

  // Returns paginated inventory item options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns the UOM symbol for a given UOM ID
  async findUomSymbol(uomId: string): Promise<string | null> {
    const result = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, uomId));
    return result[0]?.symbol ?? null;
  }

  // Returns all stock levels for an inventory item
  async findLevelsByItemId(itemId: string): Promise<InventoryLevel[]> {
    return this.db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.inventoryItemId, itemId));
  }

  // Returns the stock level for an item at a specific BU (creates if missing)
  async findOrCreateLevel(itemId: string, buId: string): Promise<InventoryLevel> {
    const existing = await this.db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.inventoryItemId, itemId))
      .then((rows) => rows.find((r) => r.businessUnitId === buId));

    if (existing) return existing;

    const results = await this.db
      .insert(inventoryLevels)
      .values({ inventoryItemId: itemId } as NewInventoryLevel)
      .returning();
    return results[0] as InventoryLevel;
  }

  // Returns recent ledger entries for an inventory item (newest first)
  async findLedgerByItemId(itemId: string, limit = 50): Promise<InventoryLedgerEntry[]> {
    return this.db
      .select()
      .from(inventoryLedger)
      .where(eq(inventoryLedger.inventoryItemId, itemId))
      .orderBy(desc(inventoryLedger.createdAt))
      .limit(limit);
  }

  // Appends a ledger entry
  async createLedgerEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await this.db.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }
}
