import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  CostCategoryKindValues,
  costCategories,
  inventoryItemCosts,
  inventoryItemQuantCosts,
  type NewInventoryItemQuantCost,
} from '@/db/schema';

@Injectable()
export class InventoryItemCostsRepository extends PrimaryBaseRepository<typeof inventoryItemCosts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemCosts);
  }

  // Resolves the org's single ITEM-kind cost category id; the partial unique index guarantees at
  // most one, so limit(1) is enough. Returns null when the org has no ITEM category seeded.
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
}
