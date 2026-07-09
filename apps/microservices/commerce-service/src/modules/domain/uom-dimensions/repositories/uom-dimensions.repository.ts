import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, ilike, inArray, or, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, supplierItems, type UomDimension, uom, uomDimensions } from '@/db/schema';

@Injectable()
export class UomDimensionsRepository extends PrimaryBaseRepository<typeof uomDimensions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, uomDimensions);
  }

  async findByCode(code: string): Promise<UomDimension | undefined> {
    return this.model.findFirst({ where: { code } });
  }

  // Returns dimensions, optionally filtered by name or code search
  async findAllOrSearch(search?: string): Promise<UomDimension[]> {
    const where = search
      ? or(ilike(uomDimensions.name, `%${search}%`), ilike(uomDimensions.code, `%${search}%`))
      : undefined;
    return this.db.select().from(uomDimensions).where(where).orderBy(uomDimensions.name);
  }

  // Counts external entities (inventory items, supplier items) that reference any UOM in this dimension.
  // UOMs themselves are excluded — they cascade with the dimension.
  async countReferences(id: string): Promise<{ inventoryItems: number; supplierItems: number }> {
    const [invResult, suppResult] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryItems)
        .innerJoin(uom, eq(uom.id, inventoryItems.uomId))
        .where(eq(uom.dimensionId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(supplierItems)
        .innerJoin(uom, eq(uom.id, supplierItems.uomId))
        .where(eq(uom.dimensionId, id)),
    ]);
    return {
      inventoryItems: Number(invResult[0]?.count ?? 0),
      supplierItems: Number(suppResult[0]?.count ?? 0),
    };
  }

  // Batch version of countReferences for the list: of the given dimension ids, returns the set that are
  // referenced by any inventory item or supplier item (through their UOM). Lets the list compute canDelete
  // per row in two queries instead of an N+1 countReferences per dimension.
  async findReferencedDimensionIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const [invRows, suppRows] = await Promise.all([
      this.db
        .selectDistinct({ dimensionId: uom.dimensionId })
        .from(inventoryItems)
        .innerJoin(uom, eq(uom.id, inventoryItems.uomId))
        .where(inArray(uom.dimensionId, ids)),
      this.db
        .selectDistinct({ dimensionId: uom.dimensionId })
        .from(supplierItems)
        .innerJoin(uom, eq(uom.id, supplierItems.uomId))
        .where(inArray(uom.dimensionId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...invRows, ...suppRows]) {
      if (row.dimensionId) referenced.add(row.dimensionId);
    }
    return referenced;
  }

  // Bulk-deletes all UOMs in a dimension (used to cascade on dimension delete)
  async deleteUomsByDimensionId(id: string): Promise<void> {
    await this.db.delete(uom).where(eq(uom.dimensionId, id));
  }
}
