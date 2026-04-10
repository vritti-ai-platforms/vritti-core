import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type ConversionInput,
  type ConversionOutput,
  type NewConversionInput,
  type NewConversionOutput,
  conversionInputs,
  conversionOutputs,
  conversions,
  inventoryItems,
  inventoryLedger,
  inventoryLevels,
  type NewInventoryLedgerEntry,
  type InventoryLedgerEntry,
} from '@/db/schema';

@Injectable()
export class ConversionsRepository extends PrimaryBaseRepository<typeof conversions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, conversions);
  }

  // Returns all inputs for a conversion with inventory item names
  async findInputsByConversionId(
    conversionId: string,
  ): Promise<(ConversionInput & { inventoryItemName: string | null })[]> {
    const rows = await this.db
      .select({
        id: conversionInputs.id,
        organizationId: conversionInputs.organizationId,
        conversionId: conversionInputs.conversionId,
        inventoryItemId: conversionInputs.inventoryItemId,
        quantity: conversionInputs.quantity,
        wastageQuantity: conversionInputs.wastageQuantity,
        inventoryItemName: inventoryItems.name,
      })
      .from(conversionInputs)
      .leftJoin(inventoryItems, eq(conversionInputs.inventoryItemId, inventoryItems.id))
      .where(eq(conversionInputs.conversionId, conversionId));

    return rows as (ConversionInput & { inventoryItemName: string | null })[];
  }

  // Returns all outputs for a conversion with inventory item names
  async findOutputsByConversionId(
    conversionId: string,
  ): Promise<(ConversionOutput & { inventoryItemName: string | null })[]> {
    const rows = await this.db
      .select({
        id: conversionOutputs.id,
        organizationId: conversionOutputs.organizationId,
        conversionId: conversionOutputs.conversionId,
        inventoryItemId: conversionOutputs.inventoryItemId,
        quantity: conversionOutputs.quantity,
        wastageQuantity: conversionOutputs.wastageQuantity,
        inventoryItemName: inventoryItems.name,
      })
      .from(conversionOutputs)
      .leftJoin(inventoryItems, eq(conversionOutputs.inventoryItemId, inventoryItems.id))
      .where(eq(conversionOutputs.conversionId, conversionId));

    return rows as (ConversionOutput & { inventoryItemName: string | null })[];
  }

  // Creates conversion input line items
  async createInputs(items: NewConversionInput[]): Promise<ConversionInput[]> {
    if (items.length === 0) return [];
    return this.db.insert(conversionInputs).values(items).returning() as Promise<ConversionInput[]>;
  }

  // Creates conversion output line items
  async createOutputs(items: NewConversionOutput[]): Promise<ConversionOutput[]> {
    if (items.length === 0) return [];
    return this.db.insert(conversionOutputs).values(items).returning() as Promise<ConversionOutput[]>;
  }

  // Deducts from inventory level stocked quantity
  async deductFromInventoryLevel(inventoryItemId: string, quantity: number): Promise<void> {
    await this.db
      .update(inventoryLevels)
      .set({
        stockedQuantity: sql`${inventoryLevels.stockedQuantity} - ${String(quantity)}`,
      })
      .where(eq(inventoryLevels.inventoryItemId, inventoryItemId));
  }

  // Adds to inventory level stocked quantity (upserts if not exists)
  async addToInventoryLevel(inventoryItemId: string, quantity: number): Promise<void> {
    const existing = await this.db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.inventoryItemId, inventoryItemId))
      .then((rows) => rows[0]);

    if (existing) {
      await this.db
        .update(inventoryLevels)
        .set({
          stockedQuantity: sql`${inventoryLevels.stockedQuantity} + ${String(quantity)}`,
        })
        .where(eq(inventoryLevels.id, existing.id));
    } else {
      await this.db.insert(inventoryLevels).values({
        inventoryItemId,
        stockedQuantity: String(quantity),
      });
    }
  }

  // Appends a ledger entry
  async createLedgerEntry(data: NewInventoryLedgerEntry): Promise<InventoryLedgerEntry> {
    const results = await this.db.insert(inventoryLedger).values(data).returning();
    return results[0] as InventoryLedgerEntry;
  }
}
