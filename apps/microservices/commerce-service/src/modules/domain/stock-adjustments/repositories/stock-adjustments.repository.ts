import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItems,
  type NewStockAdjustment,
  type StockAdjustment,
  type StockAdjustmentStatus,
  stockAdjustmentCodeSeq,
  stockAdjustmentLines,
  stockAdjustments,
  uom,
} from '@/db/schema';

@Injectable()
export class StockAdjustmentsRepository extends PrimaryBaseRepository<typeof stockAdjustments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustments, { sequence: stockAdjustmentCodeSeq });
  }

  async findAllForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (StockAdjustment & {
      inventoryItemName: string;
      createdByFullName: string;
    })[];
    count: number;
  }> {
    return this.findAllAndCount<
      StockAdjustment & {
        inventoryItemName: string;
        inventoryItemUomSymbol: string | null;
        createdByFullName: string;
      }
    >({
      select: {
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        businessUnitId: stockAdjustments.businessUnitId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        quantity: stockAdjustments.quantity,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        createdById: stockAdjustments.createdById,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomSymbol: uom.symbol,
        createdByFullName: sql<string>`''`.as('created_by_full_name'),
      },
      leftJoins: [
        { table: inventoryItems, on: eq(stockAdjustments.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustments.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByIdWithItemName(id: string): Promise<
    | (StockAdjustment & {
        inventoryItemName: string;
        inventoryItemUomSymbol: string | null;
        createdByFullName: string;
        isPublishable: boolean;
      })
    | undefined
  > {
    const rows = await this.db
      .select({
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        businessUnitId: stockAdjustments.businessUnitId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        quantity: stockAdjustments.quantity,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        createdById: stockAdjustments.createdById,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomSymbol: uom.symbol,
        createdByFullName: sql<string>`''`.as('created_by_full_name'),
        isPublishable: sql<boolean>`(
          ${stockAdjustments.status} = 'DRAFT'
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) > 0
          AND COALESCE(SUM(${stockAdjustmentLines.quantity}), 0) = ${stockAdjustments.quantity}
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) =
              COUNT(DISTINCT CASE WHEN ${stockAdjustmentLines.isBalanced} THEN ${stockAdjustmentLines.id} END)
        )`,
      })
      .from(stockAdjustments)
      .innerJoin(inventoryItems, eq(stockAdjustments.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .leftJoin(stockAdjustmentLines, eq(stockAdjustments.id, stockAdjustmentLines.stockAdjustmentId))
      .where(eq(stockAdjustments.id, id))
      .groupBy(
        stockAdjustments.id,
        stockAdjustments.organizationId,
        stockAdjustments.businessUnitId,
        stockAdjustments.inventoryItemId,
        stockAdjustments.code,
        stockAdjustments.type,
        stockAdjustments.quantity,
        stockAdjustments.status,
        stockAdjustments.reason,
        stockAdjustments.createdById,
        stockAdjustments.publishedAt,
        stockAdjustments.createdAt,
        inventoryItems.name,
        uom.symbol,
      )
      .limit(1);

    const [row] = rows;

    return row as
      | (StockAdjustment & {
          inventoryItemName: string;
          inventoryItemUomSymbol: string | null;
          createdByFullName: string;
          isPublishable: boolean;
        })
      | undefined;
  }

  async updateStatusInTx(
    tx: TypedDrizzleClient,
    id: string,
    status: StockAdjustmentStatus,
    publishedAt?: Date,
  ): Promise<void> {
    await tx
      .update(stockAdjustments)
      .set({ status, ...(publishedAt ? { publishedAt } : {}) })
      .where(eq(stockAdjustments.id, id));
  }

  // Generates a unique stock adjustment code (org-scoped via RLS)
  async generateCode(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `SA-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Creates a stock adjustment with an auto-generated code
  async create(data: Omit<NewStockAdjustment, 'code'>): Promise<StockAdjustment> {
    const code = await this.generateCode();
    return super.create({ ...data, code });
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(stockAdjustments).where(eq(stockAdjustments.id, id));
  }
}
