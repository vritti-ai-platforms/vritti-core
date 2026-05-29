import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk';
import { eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bomLines,
  categories,
  conversionInputs,
  conversionOutputs,
  inventoryItems,
  inventoryItemUomConversions,
  purchaseOrderItems,
  stockAdjustments,
  stockTransfers,
  supplierItems,
  uom,
} from '@/db/schema';

@Injectable()
export class InventoryItemsRepository extends PrimaryBaseRepository<typeof inventoryItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItems);
  }

  // Returns paginated inventory item options for select dropdowns.
  // When excludeOnSupplierId is supplied, hides items whose every allowed UOM (per-item overrides plus
  // the global UOM family rooted on the item's primary UOM) is already linked to that supplier — i.e.
  // no remaining (inventoryItemId, uomId) pair is available to create another supplier_items row.
  // Overrides the base findForSelect to add the UOM LEFT JOIN (so `symbol` is reachable via additionalKeys)
  // and the optional supplier filter.
  override async findForSelect(
    config: FindForSelectConfig,
    options?: { excludeOnSupplierId?: string },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (options?.excludeOnSupplierId) {
      conditions.push(sql`EXISTS (
        WITH allowed AS (
          SELECT DISTINCT id AS uom_id FROM (
            SELECT uic.uom_id AS id
            FROM ${inventoryItemUomConversions} uic
            WHERE uic.inventory_item_id = ${inventoryItems.id}
            UNION
            SELECT u.id
            FROM ${uom} u
            WHERE COALESCE(u.base_unit_id, u.id) = (
              SELECT COALESCE(base_unit_id, id) FROM ${uom} WHERE id = ${inventoryItems.uomId}
            )
          ) sub
        )
        SELECT 1 FROM allowed a
        WHERE NOT EXISTS (
          SELECT 1 FROM ${supplierItems} si
          WHERE si.supplier_id = ${options.excludeOnSupplierId}
            AND si.inventory_item_id = ${inventoryItems.id}
            AND si.uom_id = a.uom_id
        )
      )`);
    }

    return super.findForSelect({
      ...config,
      joins: [{ table: uom, on: eq(inventoryItems.uomId, uom.id), type: 'left' }],
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions,
    });
  }

  // Returns the set of UOM IDs allowed to transact for a given inventory item:
  //  - the item's primary UOM
  //  - every per-item conversion override
  //  - every UOM in the same global "family" (sharing COALESCE(base_unit_id, id) with the primary)
  async findAllowedUomIds(inventoryItemId: string): Promise<string[]> {
    const result = await this.db.execute<{ id: string }>(sql`
      WITH p AS (
        SELECT COALESCE(base_unit_id, id) AS family_root
        FROM ${uom}
        WHERE id = (SELECT uom_id FROM ${inventoryItems} WHERE id = ${inventoryItemId})
      )
      SELECT DISTINCT id FROM (
        SELECT uom_id AS id
        FROM ${inventoryItemUomConversions}
        WHERE inventory_item_id = ${inventoryItemId}
        UNION
        SELECT u.id
        FROM ${uom} u, p
        WHERE COALESCE(u.base_unit_id, u.id) = p.family_root
      ) sub;
    `);
    return ((result as unknown as { rows: { id: string }[] }).rows ?? []).map((r) => r.id);
  }

  // Returns paginated inventory items with UOM symbol via LEFT JOIN
  async findAllWithUom(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (typeof inventoryItems.$inferSelect & { uomSymbol: string | null; categoryName: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        ...inventoryItems,
        uomSymbol: uom.symbol,
        categoryName: sql<string | null>`(
          SELECT c.name
          FROM ${categories} c
          WHERE c.id = ${inventoryItems.categoryId}
        )`,
      },
      leftJoin: { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Returns a single inventory item with UOM symbol and category name via LEFT JOINs
  async findByIdWithUomAndCategory(
    id: string,
  ): Promise<(typeof inventoryItems.$inferSelect & { uomSymbol: string | null; categoryName: string | null }) | null> {
    const [row] = await this.db
      .select({
        id: inventoryItems.id,
        organizationId: inventoryItems.organizationId,
        businessUnitId: inventoryItems.businessUnitId,
        name: inventoryItems.name,
        code: inventoryItems.code,
        type: inventoryItems.type,
        tracking: inventoryItems.tracking,
        pickStrategy: inventoryItems.pickStrategy,
        categoryId: inventoryItems.categoryId,
        description: inventoryItems.description,
        uomId: inventoryItems.uomId,
        metadata: inventoryItems.metadata,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        uomSymbol: uom.symbol,
        categoryName: categories.name,
      })
      .from(inventoryItems)
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
      .where(eq(inventoryItems.id, id))
      .limit(1);

    return row ?? null;
  }

  // Returns the UOM symbol for a given UOM ID
  async findUomSymbol(uomId: string): Promise<string | null> {
    const result = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, uomId));
    return result[0]?.symbol ?? null;
  }

  // Returns category name for a given category ID
  async findCategoryName(categoryId: string): Promise<string | null> {
    const result = await this.db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId));
    return result[0]?.name ?? null;
  }

  // Returns a set of inventory item IDs that have at least one non-cascading reference
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const [bom, convIn, convOut, adj, transfers, poItems] = await Promise.all([
      this.db.select({ id: bomLines.inventoryItemId }).from(bomLines).where(inArray(bomLines.inventoryItemId, ids)),
      this.db
        .select({ id: conversionInputs.inventoryItemId })
        .from(conversionInputs)
        .where(inArray(conversionInputs.inventoryItemId, ids)),
      this.db
        .select({ id: conversionOutputs.inventoryItemId })
        .from(conversionOutputs)
        .where(inArray(conversionOutputs.inventoryItemId, ids)),
      this.db
        .select({ id: stockAdjustments.inventoryItemId })
        .from(stockAdjustments)
        .where(inArray(stockAdjustments.inventoryItemId, ids)),
      this.db
        .select({ id: stockTransfers.inventoryItemId })
        .from(stockTransfers)
        .where(inArray(stockTransfers.inventoryItemId, ids)),
      this.db
        .select({ id: purchaseOrderItems.inventoryItemId })
        .from(purchaseOrderItems)
        .where(inArray(purchaseOrderItems.inventoryItemId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...bom, ...convIn, ...convOut, ...adj, ...transfers, ...poItems]) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Counts non-cascading references for a specific inventory item
  async countReferences(id: string): Promise<{
    bomLines: number;
    conversions: number;
    stockAdjustments: number;
    stockTransfers: number;
    purchaseOrderItems: number;
  }> {
    const [bomResult, convInResult, convOutResult, adjResult, transferResult, poResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(bomLines).where(eq(bomLines.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(conversionInputs)
        .where(eq(conversionInputs.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(conversionOutputs)
        .where(eq(conversionOutputs.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(stockAdjustments)
        .where(eq(stockAdjustments.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(stockTransfers)
        .where(eq(stockTransfers.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.inventoryItemId, id)),
    ]);
    return {
      bomLines: Number(bomResult[0]?.count ?? 0),
      conversions: Number(convInResult[0]?.count ?? 0) + Number(convOutResult[0]?.count ?? 0),
      stockAdjustments: Number(adjResult[0]?.count ?? 0),
      stockTransfers: Number(transferResult[0]?.count ?? 0),
      purchaseOrderItems: Number(poResult[0]?.count ?? 0),
    };
  }
}
