import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type CatalogListing,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  type InventoryItemMrp,
  inventoryItemMrps,
  listingPriceSpecificity,
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
      code: offeringVariants.code,
      variantName: offeringVariants.name,
      isVariantActive: offeringVariants.isActive,
      isOfferingActive: offeringVariants.isOfferingActive,
      mrpAmount: inventoryItemMrps.amount,
      mrpCurrencyCode: inventoryItemMrps.currencyCode,
      mrpUomSymbol: uom.symbol,
      createdAt: catalogListings.createdAt,
      updatedAt: catalogListings.updatedAt,
    };
  }

  // The variant is NOT NULL with a cascading FK, so every listing has exactly one — inner-joining it
  // is what makes `code` and `variantName` non-null instead of merely looking optional.
  private variantJoin() {
    return [{ table: offeringVariants, on: eq(offeringVariants.id, catalogListings.offeringVariantId) }];
  }

  // An MRP is optional, and its uom hangs off the MRP, so both are genuinely absent sometimes
  private mrpJoins() {
    return [
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
      innerJoins: this.variantJoin(),
      leftJoins: this.mrpJoins(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByIdWithRefs(id: string): Promise<CatalogListingRow | undefined> {
    const { result } = await this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      innerJoins: this.variantJoin(),
      leftJoins: this.mrpJoins(),
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

  // Channels this listing is excluded from — absent means it is available everywhere the catalog reaches
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
      .innerJoin(uom, eq(uom.id, inventoryItemMrps.uomId))
      .where(eq(offeringBom.variantId, offeringVariantId))
      .orderBy(asc(inventoryItemMrps.amount));
  }

  // One price per (listing, currency): the narrowest workspace that set one. Reach has already hidden
  // the rows this workspace may not see, so distinct-on picks between its own and its ancestors' —
  // the same precedence a storefront read resolves with, decided in one place.
  async findPrices(catalogListingIds: string[], currencyCode?: string): Promise<CatalogListingPriceRow[]> {
    if (catalogListingIds.length === 0) return [];
    return this.db
      .selectDistinctOn([catalogListingPrices.catalogListingId, catalogListingPrices.currencyCode], {
        id: catalogListingPrices.id,
        catalogListingId: catalogListingPrices.catalogListingId,
        currencyCode: catalogListingPrices.currencyCode,
        amount: catalogListingPrices.amount,
        legalEntityId: catalogListingPrices.legalEntityId,
        siteId: catalogListingPrices.siteId,
        isOwned: ownedByWorkspaceExpression('catalog_listing_prices'),
      })
      .from(catalogListingPrices)
      .where(
        and(
          inArray(catalogListingPrices.catalogListingId, catalogListingIds),
          currencyCode ? eq(catalogListingPrices.currencyCode, currencyCode) : undefined,
        ),
      )
      .orderBy(
        asc(catalogListingPrices.catalogListingId),
        asc(catalogListingPrices.currencyCode),
        desc(listingPriceSpecificity),
      );
  }

  // Sets this workspace's own price for a (listing, currency). The scope columns default from the
  // request's workspace, so the row lands on whoever is writing it — an org price and the site price
  // that overrides it are two rows, and neither can edit the other.
  async upsertPrice(catalogListingId: string, currencyCode: string, amount: bigint): Promise<void> {
    await this.db
      .insert(catalogListingPrices)
      .values({ catalogListingId, currencyCode, amount })
      .onConflictDoUpdate({
        target: [
          catalogListingPrices.catalogListingId,
          catalogListingPrices.currencyCode,
          catalogListingPrices.legalEntityId,
          catalogListingPrices.siteId,
        ],
        set: { amount },
      });
  }

  // Clears this workspace's own price, leaving any wider one to apply again. The delete policy admits
  // only rows owned by exactly this workspace, so a narrower scope cannot erase what it inherited.
  async deleteOwnPrice(catalogListingId: string, currencyCode: string): Promise<number> {
    const rows = (await this.db
      .delete(catalogListingPrices)
      .where(
        and(
          eq(catalogListingPrices.catalogListingId, catalogListingId),
          eq(catalogListingPrices.currencyCode, currencyCode),
        ),
      )
      .returning({ id: catalogListingPrices.id })) as { id: string }[];
    return rows.length;
  }
}
