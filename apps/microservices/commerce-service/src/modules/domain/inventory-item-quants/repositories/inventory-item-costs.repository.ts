import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  CostCategoryKindValues,
  type CostSourceType,
  costCategories,
  inventoryItemCosts,
  inventoryItemQuantCosts,
  type NewInventoryItemQuantCost,
} from '@/db/schema';

@Injectable()
export class InventoryItemCostsDomainRepository extends PrimaryBaseRepository<typeof inventoryItemCosts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemCosts);
  }

  // Resolves the org's single ITEM-kind cost category id; the partial unique index guarantees at most one, so limit(1)
  // is enough.
  async findItemCategoryId(): Promise<string | null> {
    const rows = await this.db
      .select({ id: costCategories.id })
      .from(costCategories)
      .where(eq(costCategories.kind, CostCategoryKindValues.ITEM))
      .limit(1);
    return rows[0]?.id ?? null;
  }

  // Inserts a cost header row and returns its id.
  async insertCost(data: typeof inventoryItemCosts.$inferInsert): Promise<string> {
    const rows = await this.db.insert(inventoryItemCosts).values(data).returning({ id: inventoryItemCosts.id });
    return (rows[0] as { id: string }).id;
  }

  // Bulk-inserts per-quant allocation junction rows.
  async insertQuantCosts(rows: NewInventoryItemQuantCost[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(inventoryItemQuantCosts).values(rows);
  }

  // Removes the costs the given sources booked, their per-quant allocations first
  async deleteBySources(sourceType: CostSourceType, sourceIds: string[]): Promise<void> {
    if (sourceIds.length === 0) return;
    const bookedBySources = this.bookedBy(sourceType, sourceIds);
    await this.db
      .delete(inventoryItemQuantCosts)
      .where(
        inArray(
          inventoryItemQuantCosts.costId,
          this.db.select({ id: inventoryItemCosts.id }).from(inventoryItemCosts).where(bookedBySources),
        ),
      );
    await this.deleteMany(bookedBySources);
  }

  // Matches the costs of the given source type booked by the given sources
  private bookedBy(sourceType: CostSourceType, sourceIds: string[]): SQL {
    return and(eq(inventoryItemCosts.sourceType, sourceType), inArray(inventoryItemCosts.sourceId, sourceIds)) as SQL;
  }
}
