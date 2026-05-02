import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { eq, ilike, or, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, supplierItems, type UomDimension, uom, uomDimensions } from '@/db/schema';

@Injectable()
export class UomDimensionsRepository extends PrimaryBaseRepository<typeof uomDimensions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, uomDimensions);
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

  // Bulk-deletes all UOMs in a dimension (used to cascade on dimension delete)
  async deleteUomsByDimensionId(tx: TypedDrizzleClient, id: string): Promise<void> {
    await tx.delete(uom).where(eq(uom.dimensionId, id));
  }
}
