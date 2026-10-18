import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { FindForSelectConfig } from '@vritti/api-sdk/select';
import {
  catalogListings,
  type InventoryItemMrp,
  inventoryItemMrps,
  inventoryItems,
  offeringBom,
  uom,
} from '@/db/schema';

export type InventoryItemMrpWithUom = InventoryItemMrp & { uomSymbol: string | null };

@Injectable()
export class InventoryItemMrpsDomainRepository extends PrimaryBaseRepository<typeof inventoryItemMrps> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemMrps);
  }

  // The MRPs a variant could be listed at: the recorded prices of whatever its bill of materials draws on,
  // narrowed to one currency when the caller is pricing in one — a listing keyed to an MRP must be priced
  // in that MRP's currency, so offering the others only leads to a refusal
  findForVariantSelect(
    variantId: string,
    currencyCode: string | undefined,
    catalogId: string | undefined,
    config: Omit<FindForSelectConfig, 'conditions' | 'joins'>,
  ) {
    const conditions = [
      // EXISTS rather than a join to offering_bom: a variant may draw on one item several times, and a
      // join would then offer the same printed price once per BOM line
      sql`exists (
        select 1 from ${offeringBom}
        where ${offeringBom.inventoryItemId} = ${inventoryItemMrps.inventoryItemId}
          and ${offeringBom.variantId} = ${variantId}
      )`,
    ];
    if (currencyCode) conditions.push(eq(inventoryItemMrps.currencyCode, currencyCode) as SQL);
    // The same variant may be listed once per MRP but never twice at one, so a taken MRP is not offered
    if (catalogId) {
      conditions.push(
        sql`not exists (
        select 1 from ${catalogListings}
        where ${catalogListings.inventoryItemMrpId} = ${inventoryItemMrps.id}
          and ${catalogListings.offeringVariantId} = ${variantId}
          and ${catalogListings.catalogId} = ${catalogId}
      )` as SQL,
      );
    }

    return this.findForSelect({
      ...config,
      joins: [{ table: uom, on: eq(uom.id, inventoryItemMrps.uomId), type: 'left' }],
      conditions,
    });
  }

  // Records an MRP observed at goods receipt and makes it current, keeping every prior amount
  async upsert(
    inventoryItemId: string,
    uomId: string,
    currencyCode: string,
    amount: bigint,
    sourceLotId: string | null,
  ): Promise<InventoryItemMrp> {
    return this.transaction(async () => {
      await this.clearCurrent(inventoryItemId, uomId, currencyCode);
      const [row] = (await this.db
        .insert(inventoryItemMrps)
        .values({ inventoryItemId, uomId, currencyCode, amount, sourceLotId, sourcedAt: new Date(), isCurrent: true })
        .onConflictDoUpdate({
          target: [
            inventoryItemMrps.inventoryItemId,
            inventoryItemMrps.uomId,
            inventoryItemMrps.currencyCode,
            inventoryItemMrps.amount,
          ],
          set: { sourceLotId, sourcedAt: new Date(), isCurrent: true },
        })
        .returning()) as InventoryItemMrp[];
      return row;
    });
  }

  // Promotes one MRP to current for its (item, uom, currency) triple; returns undefined when no row matches
  async setCurrent(id: string): Promise<InventoryItemMrp | undefined> {
    return this.transaction(async () => {
      const target = await this.model.findFirst({ where: { id } });
      if (!target) return undefined;
      await this.clearCurrent(target.inventoryItemId, target.uomId, target.currencyCode);
      const [row] = (await this.db
        .update(inventoryItemMrps)
        .set({ isCurrent: true })
        .where(eq(inventoryItemMrps.id, id))
        .returning()) as InventoryItemMrp[];
      return row;
    });
  }

  // Counts the MRPs recorded for an (item, uom, currency) triple
  async countForTriple(inventoryItemId: string, uomId: string, currencyCode: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(inventoryItemMrps)
      .where(
        and(
          eq(inventoryItemMrps.inventoryItemId, inventoryItemId),
          eq(inventoryItemMrps.uomId, uomId),
          eq(inventoryItemMrps.currencyCode, currencyCode),
        ),
      );
    return row?.n ?? 0;
  }

  // The partial unique index permits one current row per triple, so the old one is cleared first
  private async clearCurrent(inventoryItemId: string, uomId: string, currencyCode: string): Promise<void> {
    await this.db
      .update(inventoryItemMrps)
      .set({ isCurrent: false })
      .where(
        and(
          eq(inventoryItemMrps.inventoryItemId, inventoryItemId),
          eq(inventoryItemMrps.uomId, uomId),
          eq(inventoryItemMrps.currencyCode, currencyCode),
          eq(inventoryItemMrps.isCurrent, true),
        ),
      );
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
        isCurrent: inventoryItemMrps.isCurrent,
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
