import { Injectable } from '@nestjs/common';
import { type FindForSelectConfig, PrimaryBaseRepository, PrimaryDatabaseService, type SelectQueryResult } from '@vritti/api-sdk';
import { and, eq, ilike, isNull, or, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Uom, inventoryItems, supplierItems, uom } from '@/db/schema';

@Injectable()
export class UomRepository extends PrimaryBaseRepository<typeof uom> {
  constructor(database: PrimaryDatabaseService) {
    super(database, uom);
  }

  // Returns paginated UOM options for the select component
  findForSelect(config: FindForSelectConfig): Promise<SelectQueryResult> {
    return super.findForSelect(config);
  }

  // Returns base units, optionally filtered by name or symbol
  async findBaseUnits(search?: string): Promise<Uom[]> {
    const conditions = [isNull(uom.baseUnitId)];
    if (search) {
      conditions.push(or(ilike(uom.name, `%${search}%`), ilike(uom.symbol, `%${search}%`))!);
    }
    return this.db.select().from(uom).where(and(...conditions)).orderBy(uom.name);
  }

  // Returns all derived units for a given base unit
  async findDerivedUnits(baseUnitId: string): Promise<Uom[]> {
    return this.db.select().from(uom).where(eq(uom.baseUnitId, baseUnitId)).orderBy(uom.name);
  }

  // Checks if a UOM is referenced by inventory items, supplier items, or derived units
  async hasReferences(id: string): Promise<boolean> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(eq(inventoryItems.uomId, id));
    if (Number(result[0]?.count) > 0) return true;

    const supplierResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(supplierItems)
      .where(eq(supplierItems.uomId, id));
    if (Number(supplierResult[0]?.count) > 0) return true;

    const derivedResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(uom)
      .where(eq(uom.baseUnitId, id));
    return Number(derivedResult[0]?.count) > 0;
  }
}
