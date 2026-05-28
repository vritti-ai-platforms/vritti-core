import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type CostSourceType,
  costCategories,
  type InventoryItemCost,
  inventoryItemCosts,
} from '@/db/schema';

export interface CostRowWithCategory {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryKind: string;
  totalAmount: bigint;
  currencyCode: string;
  sourceType: CostSourceType;
  sourceId: string;
  distributionMethod: string;
  unallocatedAmount: bigint;
  vendorRef: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InventoryItemCostsRepository extends PrimaryBaseRepository<typeof inventoryItemCosts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemCosts);
  }

  async findById(id: string): Promise<InventoryItemCost | undefined> {
    const rows = await this.db.select().from(inventoryItemCosts).where(eq(inventoryItemCosts.id, id)).limit(1);
    return rows[0] as InventoryItemCost | undefined;
  }

  async findBySource(sourceType: CostSourceType, sourceId: string): Promise<InventoryItemCost[]> {
    const rows = await this.db
      .select()
      .from(inventoryItemCosts)
      .where(and(eq(inventoryItemCosts.sourceType, sourceType), eq(inventoryItemCosts.sourceId, sourceId)))
      .orderBy(asc(inventoryItemCosts.createdAt));
    return rows as InventoryItemCost[];
  }

  // Joined projection used by the Costs tab DataTable — includes the category name + kind so the
  // gateway doesn't need a second roundtrip.
  async findBySourceWithCategory(
    sourceType: CostSourceType,
    sourceId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number } = {},
  ): Promise<{ result: CostRowWithCategory[]; count: number }> {
    const baseWhere = and(
      eq(inventoryItemCosts.sourceType, sourceType),
      eq(inventoryItemCosts.sourceId, sourceId),
    );
    const where = options.where ? and(baseWhere, options.where) : baseWhere;

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryItemCosts)
      .where(where);

    const rows = await this.db
      .select({
        id: inventoryItemCosts.id,
        categoryId: inventoryItemCosts.categoryId,
        categoryName: costCategories.name,
        categoryKind: costCategories.kind,
        totalAmount: inventoryItemCosts.totalAmount,
        currencyCode: inventoryItemCosts.currencyCode,
        sourceType: inventoryItemCosts.sourceType,
        sourceId: inventoryItemCosts.sourceId,
        distributionMethod: inventoryItemCosts.distributionMethod,
        unallocatedAmount: inventoryItemCosts.unallocatedAmount,
        vendorRef: inventoryItemCosts.vendorRef,
        notes: inventoryItemCosts.notes,
        createdBy: inventoryItemCosts.createdBy,
        createdAt: inventoryItemCosts.createdAt,
        updatedAt: inventoryItemCosts.updatedAt,
      })
      .from(inventoryItemCosts)
      .innerJoin(costCategories, eq(inventoryItemCosts.categoryId, costCategories.id))
      .where(where)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(inventoryItemCosts.createdAt)]))
      .limit(options.limit ?? 100)
      .offset(options.offset ?? 0);

    return { result: rows as CostRowWithCategory[], count: Number(count ?? 0) };
  }

  // Per-kind breakdown across all cost rows for a source (used by the kind summary header).
  async findKindBreakdown(
    sourceType: CostSourceType,
    sourceId: string,
  ): Promise<{ kind: string; amount: bigint; currencyCode: string }[]> {
    const rows = await this.db
      .select({
        kind: costCategories.kind,
        currencyCode: inventoryItemCosts.currencyCode,
        amount: sql<string>`SUM(${inventoryItemCosts.totalAmount})::text`,
      })
      .from(inventoryItemCosts)
      .innerJoin(costCategories, eq(inventoryItemCosts.categoryId, costCategories.id))
      .where(and(eq(inventoryItemCosts.sourceType, sourceType), eq(inventoryItemCosts.sourceId, sourceId)))
      .groupBy(costCategories.kind, inventoryItemCosts.currencyCode);

    return rows.map((r) => ({ kind: r.kind, currencyCode: r.currencyCode, amount: BigInt(r.amount ?? '0') }));
  }

  // Inserts one cost row + returns the inserted record (with system-set columns).
  async createCost(data: typeof inventoryItemCosts.$inferInsert): Promise<InventoryItemCost> {
    const [row] = await this.db.insert(inventoryItemCosts).values(data).returning();
    return row as InventoryItemCost;
  }

  async updateCost(
    id: string,
    fields: Partial<{
      totalAmount: bigint;
      distributionMethod: 'by_value' | 'by_quantity' | 'equal';
      vendorRef: string | null;
      notes: string | null;
    }>,
  ): Promise<InventoryItemCost> {
    const [row] = await this.db
      .update(inventoryItemCosts)
      .set(fields)
      .where(eq(inventoryItemCosts.id, id))
      .returning();
    return row as InventoryItemCost;
  }

  async deleteCost(id: string): Promise<void> {
    await this.db.delete(inventoryItemCosts).where(eq(inventoryItemCosts.id, id));
  }
}
