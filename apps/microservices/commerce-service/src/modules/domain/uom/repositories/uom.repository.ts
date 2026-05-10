import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { aliasedTable, and, eq, ilike, inArray, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, inventoryItemUomConversions, supplierItems, type Uom, uom } from '@/db/schema';

export type UomWithBase = Uom & { baseUnitSymbol: string | null };

@Injectable()
export class UomRepository extends PrimaryBaseRepository<typeof uom> {
  constructor(database: PrimaryDatabaseService) {
    super(database, uom);
  }

  // Returns the UOM matching a symbol within the current BU (RLS enforces scope)
  async findBySymbol(symbol: string): Promise<Uom | undefined> {
    return this.model.findFirst({ where: { symbol } });
  }

  // Returns a subquery resolving to the UOM IDs an inventory item is allowed to transact in:
  //   (a) per-item conversion overrides in inventory_item_uom_conversions
  //   (b) every UOM in the global "family" (sharing COALESCE(base_unit_id, id) with the item's primary)
  // Used as an inArray filter inside findForSelect.
  allowedUomIdsForItemSubquery(itemId: string): SQL {
    return sql`(
      WITH p AS (
        SELECT COALESCE(base_unit_id, id) AS family_root
        FROM ${uom}
        WHERE id = (SELECT uom_id FROM ${inventoryItems} WHERE id = ${itemId})
      )
      SELECT DISTINCT id FROM (
        SELECT uom_id AS id
        FROM ${inventoryItemUomConversions}
        WHERE inventory_item_id = ${itemId}
        UNION
        SELECT u.id
        FROM ${uom} u, p
        WHERE COALESCE(u.base_unit_id, u.id) = p.family_root
      ) sub
    )`;
  }

  // Returns paginated UOMs joined with their base unit symbol (self-join via aliased uom table)
  async findForTableWithBase(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: UomWithBase[]; count: number }> {
    const baseUom = aliasedTable(uom, 'base_uom');
    const { result, count } = await this.findAllAndCount<UomWithBase>({
      select: {
        id: uom.id,
        organizationId: uom.organizationId,
        businessUnitId: uom.businessUnitId,
        dimensionId: uom.dimensionId,
        name: uom.name,
        symbol: uom.symbol,
        baseUnitId: uom.baseUnitId,
        conversionFactor: uom.conversionFactor,
        createdAt: uom.createdAt,
        baseUnitSymbol: baseUom.symbol,
      },
      leftJoins: [{ table: baseUom, on: eq(uom.baseUnitId, baseUom.id) }],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
    return { result, count };
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
    const [invItems, suppItems, derived, uomOverrides] = await Promise.all([
      this.db.select({ id: inventoryItems.uomId }).from(inventoryItems).where(inArray(inventoryItems.uomId, ids)),
      this.db.select({ id: supplierItems.uomId }).from(supplierItems).where(inArray(supplierItems.uomId, ids)),
      this.db.select({ id: uom.baseUnitId }).from(uom).where(inArray(uom.baseUnitId, ids)),
      this.db
        .select({ id: inventoryItemUomConversions.uomId })
        .from(inventoryItemUomConversions)
        .where(inArray(inventoryItemUomConversions.uomId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...invItems, ...suppItems, ...derived, ...uomOverrides]) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Counts references to this UOM across inventory items, supplier items, derived units, and per-item overrides
  async countReferences(
    id: string,
  ): Promise<{ inventoryItems: number; supplierItems: number; derivedUnits: number; uomOverrides: number }> {
    const [invResult, suppResult, derivedResult, overridesResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(inventoryItems).where(eq(inventoryItems.uomId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(supplierItems).where(eq(supplierItems.uomId, id)),
      this.db.select({ count: sql<number>`count(*)` }).from(uom).where(eq(uom.baseUnitId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryItemUomConversions)
        .where(eq(inventoryItemUomConversions.uomId, id)),
    ]);
    return {
      inventoryItems: Number(invResult[0]?.count ?? 0),
      supplierItems: Number(suppResult[0]?.count ?? 0),
      derivedUnits: Number(derivedResult[0]?.count ?? 0),
      uomOverrides: Number(overridesResult[0]?.count ?? 0),
    };
  }
}
