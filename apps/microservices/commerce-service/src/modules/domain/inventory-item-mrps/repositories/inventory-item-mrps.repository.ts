import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemMrp, inventoryItemMrps, inventoryItems, uom } from '@/db/schema';

export type InventoryItemMrpWithUom = InventoryItemMrp & { uomSymbol: string | null };

@Injectable()
export class InventoryItemMrpsRepository extends PrimaryBaseRepository<typeof inventoryItemMrps> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemMrps);
  }

  // Inserts or updates the suggested MRP for an (item, uom, currency) triple; latest lot wins.
  async upsert(
    inventoryItemId: string,
    uomId: string,
    currencyCode: string,
    amount: bigint,
    sourceLotId: string | null,
  ): Promise<InventoryItemMrp> {
    const [row] = (await this.db
      .insert(inventoryItemMrps)
      .values({ inventoryItemId, uomId, currencyCode, amount, sourceLotId, sourcedAt: new Date() })
      .onConflictDoUpdate({
        target: [inventoryItemMrps.inventoryItemId, inventoryItemMrps.uomId, inventoryItemMrps.currencyCode],
        set: { amount, sourceLotId, sourcedAt: new Date() },
      })
      .returning()) as InventoryItemMrp[];
    return row;
  }

  // Inserts a new MRP row for an (item, uom, currency) triple; the unique constraint surfaces conflicts
  async createMrp(
    inventoryItemId: string,
    uomId: string,
    currencyCode: string,
    amount: bigint,
  ): Promise<InventoryItemMrp> {
    const [row] = (await this.db
      .insert(inventoryItemMrps)
      .values({ inventoryItemId, uomId, currencyCode, amount, sourceLotId: null, sourcedAt: new Date() })
      .returning()) as InventoryItemMrp[];
    return row;
  }

  // Updates an existing MRP row's amount by id; returns undefined when no row matches
  async updateAmount(id: string, amount: bigint): Promise<InventoryItemMrp | undefined> {
    const [row] = (await this.db
      .update(inventoryItemMrps)
      .set({ amount })
      .where(eq(inventoryItemMrps.id, id))
      .returning()) as InventoryItemMrp[];
    return row;
  }

  // Returns a single MRP row by id
  async findById(id: string): Promise<InventoryItemMrp | undefined> {
    return this.model.findFirst({ where: { id } });
  }

  // Deletes an MRP row by id; returns the deleted row or undefined when none matched
  async deleteOne(id: string): Promise<InventoryItemMrp | undefined> {
    const [row] = (await this.db
      .delete(inventoryItemMrps)
      .where(eq(inventoryItemMrps.id, id))
      .returning()) as InventoryItemMrp[];
    return row;
  }

  // Returns all suggested MRPs for an inventory item (one row per uom×currency) with the uom symbol
  async findByItem(inventoryItemId: string): Promise<InventoryItemMrpWithUom[]> {
    return this.db
      .select({
        id: inventoryItemMrps.id,
        organizationId: inventoryItemMrps.organizationId,
        inventoryItemId: inventoryItemMrps.inventoryItemId,
        uomId: inventoryItemMrps.uomId,
        currencyCode: inventoryItemMrps.currencyCode,
        amount: inventoryItemMrps.amount,
        sourceLotId: inventoryItemMrps.sourceLotId,
        sourcedAt: inventoryItemMrps.sourcedAt,
        createdAt: inventoryItemMrps.createdAt,
        updatedAt: inventoryItemMrps.updatedAt,
        uomSymbol: uom.symbol,
      })
      .from(inventoryItemMrps)
      .leftJoin(uom, eq(inventoryItemMrps.uomId, uom.id))
      .where(eq(inventoryItemMrps.inventoryItemId, inventoryItemId))
      .orderBy(asc(uom.symbol), asc(inventoryItemMrps.currencyCode));
  }

  // Returns true when the uom shares the item's primary-uom family (same COALESCE(base_unit_id, id))
  async isUomInItemFamily(inventoryItemId: string, uomId: string): Promise<boolean> {
    const result = await this.db.execute<{ ok: boolean }>(sql`
      SELECT EXISTS (
        WITH p AS (
          SELECT COALESCE(base_unit_id, id) AS family_root
          FROM ${uom}
          WHERE id = (SELECT uom_id FROM ${inventoryItems} WHERE id = ${inventoryItemId})
        )
        SELECT 1 FROM ${uom} u, p WHERE u.id = ${uomId} AND COALESCE(u.base_unit_id, u.id) = p.family_root
      ) AS ok;
    `);
    return ((result as unknown as { rows: { ok: boolean }[] }).rows ?? [])[0]?.ok ?? false;
  }
}
