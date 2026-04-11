import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq, ilike, inArray, isNull, or, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, supplierItems, type Uom, uom } from '@/db/schema';

@Injectable()
export class UomRepository extends PrimaryBaseRepository<typeof uom> {
  constructor(database: PrimaryDatabaseService) {
    super(database, uom);
  }

  // Returns base units, optionally filtered by name or symbol
  async findBaseUnits(search?: string): Promise<Uom[]> {
    const baseCondition = isNull(uom.baseUnitId);
    const where = search
      ? and(baseCondition, or(ilike(uom.name, `%${search}%`), ilike(uom.symbol, `%${search}%`)))
      : baseCondition;
    return this.db.select().from(uom).where(where).orderBy(uom.name);
  }

  // Returns all derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<Uom[]> {
    return this.db.select().from(uom).where(eq(uom.baseUnitId, baseUnitId)).orderBy(uom.name);
  }

  // Returns a set of UOM IDs that have at least one reference (cannot be deleted)
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const [invItems, suppItems, derived] = await Promise.all([
      this.db.select({ id: inventoryItems.uomId }).from(inventoryItems).where(inArray(inventoryItems.uomId, ids)),
      this.db.select({ id: supplierItems.uomId }).from(supplierItems).where(inArray(supplierItems.uomId, ids)),
      this.db.select({ id: uom.baseUnitId }).from(uom).where(inArray(uom.baseUnitId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...invItems, ...suppItems, ...derived]) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Counts references to this UOM across inventory items, supplier items, and derived units
  async countReferences(id: string): Promise<{ inventoryItems: number; supplierItems: number; derivedUnits: number }> {
    const [invResult, suppResult, derivedResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(inventoryItems).where(eq(inventoryItems.uomId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(supplierItems).where(eq(supplierItems.uomId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(uom).where(eq(uom.baseUnitId, id)),
    ]);
    return {
      inventoryItems: Number(invResult[0]?.count ?? 0),
      supplierItems: Number(suppResult[0]?.count ?? 0),
      derivedUnits: Number(derivedResult[0]?.count ?? 0),
    };
  }
}
