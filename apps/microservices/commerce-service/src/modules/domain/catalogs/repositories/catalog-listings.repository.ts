import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type CatalogListing,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  type InventoryItemMrp,
  inventoryItemMrps,
  type NewCatalogListing,
  offeringBom,
  offeringVariants,
  ownedByWorkspaceExpression,
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
      siteId: catalogListings.siteId,
      isOwned: ownedByWorkspaceExpression(),
      inventoryItemMrpId: catalogListings.inventoryItemMrpId,
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

  async insertListing(row: NewCatalogListing): Promise<CatalogListing> {
    const [created] = (await this.db.insert(catalogListings).values(row).returning()) as CatalogListing[];
    return created;
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

  // An exclusion belongs to the channel, so the write is gated on owning the channel. Read here rather
  // than through the channels domain — a domain module never imports another.
  async findChannelOwnership(channelId: string): Promise<{ id: string; isOwn: boolean } | undefined> {
    const [row] = await this.db
      .select({ id: catalogChannels.id, isOwn: ownedByWorkspaceExpression('catalog_channels') })
      .from(catalogChannels)
      .where(eq(catalogChannels.id, channelId))
      .limit(1);
    return row;
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

  async deletePrice(id: string): Promise<void> {
    await this.db.delete(catalogListingPrices).where(eq(catalogListingPrices.id, id));
  }
}
