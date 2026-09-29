import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, inArray, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type FulfilmentType,
  inventoryItems,
  type NewOfferingBomLine,
  offeringBom,
  offerings,
  offeringVariants,
  ownedByWorkspaceExpression,
  uom,
} from '@/db/schema';

export interface BomOfferingRef {
  id: string;
  isOwned: boolean;
}

export interface BomVariantRef {
  id: string;
  offeringId: string;
  sku: string;
  fulfilmentType: FulfilmentType;
}

@Injectable()
export class OfferingBomDomainRepository extends PrimaryBaseRepository<typeof offeringBom> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offeringBom);
  }

  // The variant a bill of materials hangs off. Read here rather than through the variants module —
  // a domain module owns its own cross-table reads.
  async findVariant(variantId: string): Promise<BomVariantRef | undefined> {
    const [row] = await this.db
      .select({
        id: offeringVariants.id,
        offeringId: offeringVariants.offeringId,
        sku: offeringVariants.sku,
        fulfilmentType: offeringVariants.fulfilmentType,
      })
      .from(offeringVariants)
      .where(eq(offeringVariants.id, variantId))
      .limit(1);
    return row;
  }

  // The offering above the variant, for the ownership check a write needs
  async findOffering(offeringId: string): Promise<BomOfferingRef | undefined> {
    const [row] = await this.db
      .select({ id: offerings.id, isOwned: ownedByWorkspaceExpression() })
      .from(offerings)
      .where(eq(offerings.id, offeringId))
      .limit(1);
    return row;
  }

  async isVariantActive(variantId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ isActive: offeringVariants.isActive })
      .from(offeringVariants)
      .where(eq(offeringVariants.id, variantId))
      .limit(1);
    return row?.isActive ?? false;
  }

  // A variant that no longer satisfies its fulfilment type cannot stay sellable
  async setVariantInactive(variantId: string): Promise<void> {
    await this.db.update(offeringVariants).set({ isActive: false }).where(eq(offeringVariants.id, variantId));
  }

  // Lines with the item and unit names the UI shows
  async findLines(variantIds: string[]) {
    if (variantIds.length === 0) return [];
    return this.db
      .select({
        id: offeringBom.id,
        variantId: offeringBom.variantId,
        inventoryItemId: offeringBom.inventoryItemId,
        inventoryItemName: inventoryItems.name,
        inventoryItemSku: inventoryItems.sku,
        quantity: offeringBom.quantity,
        uomId: offeringBom.uomId,
        uomName: uom.name,
        sortOrder: offeringBom.sortOrder,
      })
      .from(offeringBom)
      .innerJoin(inventoryItems, eq(inventoryItems.id, offeringBom.inventoryItemId))
      .innerJoin(uom, eq(uom.id, offeringBom.uomId))
      .where(inArray(offeringBom.variantId, variantIds))
      .orderBy(asc(offeringBom.sortOrder));
  }

  // The inventory item already carrying a variant's SKU — the suggestion the BOM view offers
  async findInventoryItemBySku(sku: string): Promise<{ id: string; name: string; uomId: string } | undefined> {
    const [row] = await this.db
      .select({ id: inventoryItems.id, name: inventoryItems.name, uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(eq(inventoryItems.sku, sku))
      .limit(1);
    return row;
  }

  // One line, with the variant it belongs to, so ownership can be checked from a line id alone
  async findLine(lineId: string): Promise<(typeof offeringBom.$inferSelect & { variantId: string }) | undefined> {
    const [row] = await this.db.select().from(offeringBom).where(eq(offeringBom.id, lineId)).limit(1);
    return row;
  }

  async countLines(variantId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringBom)
      .where(eq(offeringBom.variantId, variantId));
    return row?.n ?? 0;
  }

  async insertLine(row: NewOfferingBomLine): Promise<void> {
    await this.db.insert(offeringBom).values(row);
  }

  async updateLine(lineId: string, data: { quantity?: number; uomId?: string }): Promise<void> {
    await this.db.update(offeringBom).set(data).where(eq(offeringBom.id, lineId));
  }

  async deleteLine(lineId: string): Promise<void> {
    await this.db.delete(offeringBom).where(eq(offeringBom.id, lineId));
  }

  async nextSortOrder(variantId: string): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number | null>`max(${offeringBom.sortOrder})` })
      .from(offeringBom)
      .where(eq(offeringBom.variantId, variantId));
    return (row?.max ?? -1) + 1;
  }

  async replaceLines(variantId: string, lines: NewOfferingBomLine[]): Promise<void> {
    await this.db.delete(offeringBom).where(eq(offeringBom.variantId, variantId));
    if (lines.length > 0) await this.db.insert(offeringBom).values(lines);
  }
}
