import { Injectable } from '@nestjs/common';
import { type FindForSelectConfig, PrimaryBaseRepository, PrimaryDatabaseService, type SelectQueryResult } from '@vritti/api-sdk';
import { desc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bomLines,
  conversionInputs,
  conversionOutputs,
  type InventoryLedgerEntry,
  type InventoryLevel,
  type NewInventoryLedgerEntry,
  type NewInventoryLevel,
  inventoryItems,
  inventoryLedger,
  inventoryLevels,
  purchaseOrderItems,
  stockAdjustments,
  stockTransfers,
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

  // Returns a set of inventory item IDs that have at least one non-cascading reference
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const [bom, convIn, convOut, adj, transfers, poItems] = await Promise.all([
      this.db.select({ id: bomLines.inventoryItemId }).from(bomLines).where(inArray(bomLines.inventoryItemId, ids)),
      this.db.select({ id: conversionInputs.inventoryItemId }).from(conversionInputs).where(inArray(conversionInputs.inventoryItemId, ids)),
      this.db.select({ id: conversionOutputs.inventoryItemId }).from(conversionOutputs).where(inArray(conversionOutputs.inventoryItemId, ids)),
      this.db.select({ id: stockAdjustments.inventoryItemId }).from(stockAdjustments).where(inArray(stockAdjustments.inventoryItemId, ids)),
      this.db.select({ id: stockTransfers.inventoryItemId }).from(stockTransfers).where(inArray(stockTransfers.inventoryItemId, ids)),
      this.db.select({ id: purchaseOrderItems.inventoryItemId }).from(purchaseOrderItems).where(inArray(purchaseOrderItems.inventoryItemId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...bom, ...convIn, ...convOut, ...adj, ...transfers, ...poItems]) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Counts non-cascading references for a specific inventory item
  async countReferences(id: string): Promise<{ bomLines: number; conversions: number; stockAdjustments: number; stockTransfers: number; purchaseOrderItems: number }> {
    const [bomResult, convInResult, convOutResult, adjResult, transferResult, poResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(bomLines).where(eq(bomLines.inventoryItemId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(conversionInputs).where(eq(conversionInputs.inventoryItemId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(conversionOutputs).where(eq(conversionOutputs.inventoryItemId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(stockAdjustments).where(eq(stockAdjustments.inventoryItemId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(stockTransfers).where(eq(stockTransfers.inventoryItemId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(purchaseOrderItems).where(eq(purchaseOrderItems.inventoryItemId, id)),
    ]);
    return {
      bomLines: Number(bomResult[0]?.count ?? 0),
      conversions: Number(convInResult[0]?.count ?? 0) + Number(convOutResult[0]?.count ?? 0),
      stockAdjustments: Number(adjResult[0]?.count ?? 0),
      stockTransfers: Number(transferResult[0]?.count ?? 0),
      purchaseOrderItems: Number(poResult[0]?.count ?? 0),
    };
  }

  // Returns all stock levels for an inventory item
  async findLevelsByItemId(itemId: string): Promise<InventoryLevel[]> {
    return this.db.select().from(inventoryLevels).where(eq(inventoryLevels.inventoryItemId, itemId));
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
    return results[0];
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
    return results[0];
  }
}
