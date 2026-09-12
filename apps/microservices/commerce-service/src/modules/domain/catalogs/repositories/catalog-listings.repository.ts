import { Injectable } from '@nestjs/common';
import { MAX_PAGE_SIZE, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, isNull, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type CatalogListing,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  type InventoryItemMrp,
  inventoryItemMrps,
  type NewCatalogListing,
  offeringBom,
  offeringVariants,
  uom,
} from '@/db/schema';
import type { CatalogListingPriceRow, CatalogListingRow, MrpOptionRow } from '../dto/entity/catalog-listing.dto';

@Injectable()
export class CatalogListingsDomainRepository extends PrimaryBaseRepository<typeof catalogListings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogListings);
  }

  private selection() {
    return {
      id: catalogListings.id,
      catalogId: catalogListings.catalogId,
      offeringVariantId: catalogListings.offeringVariantId,
      legalEntityId: catalogListings.legalEntityId,
      inventoryItemMrpId: catalogListings.inventoryItemMrpId,
      isActive: catalogListings.isActive,
      sku: offeringVariants.sku,
      variantName: offeringVariants.name,
      mrpAmount: inventoryItemMrps.amount,
      mrpCurrencyCode: inventoryItemMrps.currencyCode,
      mrpUomSymbol: uom.symbol,
      createdAt: catalogListings.createdAt,
      updatedAt: catalogListings.updatedAt,
    };
  }

  private joins() {
    return [
      { table: offeringVariants, on: eq(offeringVariants.id, catalogListings.offeringVariantId) },
      { table: inventoryItemMrps, on: eq(inventoryItemMrps.id, catalogListings.inventoryItemMrpId) },
      { table: uom, on: eq(uom.id, inventoryItemMrps.uomId) },
    ];
  }

  // One page of a catalog's listings with the variant and MRP each one carries
  async findForTable(options: {
    where: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: CatalogListingRow[]; count: number }> {
    return this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByCatalog(catalogId: string): Promise<CatalogListingRow[]> {
    const { result } = await this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(catalogListings.catalogId, catalogId),
      orderBy: [asc(offeringVariants.sku)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  async findByIdWithRefs(id: string): Promise<CatalogListingRow | undefined> {
    const { result } = await this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(catalogListings.id, id),
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  async findById(id: string): Promise<CatalogListing | undefined> {
    return this.model.findFirst({ where: { id } });
  }

  async insertListing(row: NewCatalogListing): Promise<CatalogListing> {
    const [created] = (await this.db.insert(catalogListings).values(row).returning()) as CatalogListing[];
    return created;
  }

  async updateListing(id: string, data: Partial<NewCatalogListing>): Promise<void> {
    await this.db.update(catalogListings).set(data).where(eq(catalogListings.id, id));
  }

  async deleteListing(id: string): Promise<void> {
    await this.db.delete(catalogListings).where(eq(catalogListings.id, id));
  }

  // A variant is listed either generally or by MRP slice — never both in one catalog
  async findSiblingListings(catalogId: string, offeringVariantId: string): Promise<CatalogListing[]> {
    return this.db
      .select()
      .from(catalogListings)
      .where(and(eq(catalogListings.catalogId, catalogId), eq(catalogListings.offeringVariantId, offeringVariantId)));
  }

  // The MRP a listing keys on, for validating the price against its printed ceiling
  async findMrpById(id: string): Promise<InventoryItemMrp | undefined> {
    const [row] = await this.db.select().from(inventoryItemMrps).where(eq(inventoryItemMrps.id, id)).limit(1);
    return row;
  }

  // Channels this listing is hidden on — absent means it sells everywhere the catalog reaches
  async findExclusions(catalogListingIds: string[]): Promise<{ catalogListingId: string; catalogChannelId: string }[]> {
    if (catalogListingIds.length === 0) return [];
    return this.db
      .select({
        catalogListingId: catalogListingChannelExclusions.catalogListingId,
        catalogChannelId: catalogListingChannelExclusions.catalogChannelId,
      })
      .from(catalogListingChannelExclusions)
      .where(inArray(catalogListingChannelExclusions.catalogListingId, catalogListingIds));
  }

  async addExclusion(catalogListingId: string, catalogChannelId: string): Promise<void> {
    await this.db
      .insert(catalogListingChannelExclusions)
      .values({ catalogListingId, catalogChannelId })
      .onConflictDoNothing();
  }

  async removeExclusion(catalogListingId: string, catalogChannelId: string): Promise<void> {
    await this.db
      .delete(catalogListingChannelExclusions)
      .where(
        and(
          eq(catalogListingChannelExclusions.catalogListingId, catalogListingId),
          eq(catalogListingChannelExclusions.catalogChannelId, catalogChannelId),
        ),
      );
  }

  // The MRPs a variant can be listed at — its BOM item's recorded MRPs, newest amount first
  async findMrpOptionsForVariant(offeringVariantId: string): Promise<MrpOptionRow[]> {
    return this.db
      .select({
        id: inventoryItemMrps.id,
        amount: inventoryItemMrps.amount,
        currencyCode: inventoryItemMrps.currencyCode,
        uomSymbol: uom.symbol,
        isCurrent: inventoryItemMrps.isCurrent,
      })
      .from(offeringBom)
      .innerJoin(inventoryItemMrps, eq(inventoryItemMrps.inventoryItemId, offeringBom.inventoryItemId))
      .leftJoin(uom, eq(uom.id, inventoryItemMrps.uomId))
      .where(eq(offeringBom.variantId, offeringVariantId))
      .orderBy(asc(inventoryItemMrps.amount));
  }

  async findPrices(catalogListingIds: string[]): Promise<CatalogListingPriceRow[]> {
    if (catalogListingIds.length === 0) return [];
    return this.db
      .select({
        id: catalogListingPrices.id,
        catalogListingId: catalogListingPrices.catalogListingId,
        currencyCode: catalogListingPrices.currencyCode,
        amount: catalogListingPrices.amount,
        siteId: catalogListingPrices.siteId,
      })
      .from(catalogListingPrices)
      .where(inArray(catalogListingPrices.catalogListingId, catalogListingIds))
      .orderBy(asc(catalogListingPrices.currencyCode));
  }

  // Sets the price for a (listing, currency, site) slot, replacing any existing one
  async upsertPrice(
    catalogListingId: string,
    currencyCode: string,
    amount: bigint,
    siteId: string | null,
  ): Promise<void> {
    await this.db
      .insert(catalogListingPrices)
      .values({ catalogListingId, currencyCode, amount, siteId })
      .onConflictDoUpdate({
        target: [catalogListingPrices.catalogListingId, catalogListingPrices.currencyCode, catalogListingPrices.siteId],
        set: { amount },
      });
  }

  async findPriceForSlot(
    catalogListingId: string,
    currencyCode: string,
    siteId: string | null,
  ): Promise<CatalogListingPriceRow | undefined> {
    const [row] = await this.db
      .select({
        id: catalogListingPrices.id,
        catalogListingId: catalogListingPrices.catalogListingId,
        currencyCode: catalogListingPrices.currencyCode,
        amount: catalogListingPrices.amount,
        siteId: catalogListingPrices.siteId,
      })
      .from(catalogListingPrices)
      .where(
        and(
          eq(catalogListingPrices.catalogListingId, catalogListingId),
          eq(catalogListingPrices.currencyCode, currencyCode),
          siteId === null ? isNull(catalogListingPrices.siteId) : eq(catalogListingPrices.siteId, siteId),
        ),
      )
      .limit(1);
    return row;
  }

  async deletePrice(id: string): Promise<void> {
    await this.db.delete(catalogListingPrices).where(eq(catalogListingPrices.id, id));
  }
}
