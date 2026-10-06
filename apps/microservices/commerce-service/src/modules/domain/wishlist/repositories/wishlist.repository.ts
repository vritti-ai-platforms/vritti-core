import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, desc, eq, isNull, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  catalogListingPrices,
  catalogListings,
  offerings,
  offeringVariants,
  partyChannelCatalogId,
  type WishlistItem,
  wishlistItems,
} from '@/db/schema';
import type { WishlistItemRow } from '../dto/entity/wishlist.dto';

@Injectable()
export class WishlistDomainRepository extends PrimaryBaseRepository<typeof wishlistItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, wishlistItems);
  }

  // One shopper's wishlist in one storefront, newest first
  async findForParty(
    appId: string,
    partyId: string,
    currencyCode: string,
    siteId?: string,
  ): Promise<WishlistItemRow[]> {
    const sitePrice = aliasedTable(catalogListingPrices, 'site_price');
    const orgPrice = aliasedTable(catalogListingPrices, 'org_price');

    const rows = await this.db
      .select({
        id: wishlistItems.id,
        catalogListingId: catalogListings.id,
        offeringVariantId: wishlistItems.offeringVariantId,
        // A raw template skips the column's bigint decoder, so the driver's string comes back as-is and
        // BigInt math on it throws. Decoded here, as the column itself would have been.
        amount: sql<bigint | null>`coalesce(${sitePrice.amount}, ${orgPrice.amount})`.mapWith((value: unknown) =>
          value == null ? null : BigInt(value as string),
        ),
        currencyCode: sql<string | null>`coalesce(${sitePrice.currencyCode}, ${orgPrice.currencyCode})`,
        sku: offeringVariants.sku,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(offeringVariants, eq(offeringVariants.id, wishlistItems.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, wishlistItems.offeringVariantId),
          eq(catalogListings.catalogId, partyChannelCatalogId(partyId, appId)),
        ),
      )
      .leftJoin(
        sitePrice,
        and(
          eq(sitePrice.catalogListingId, catalogListings.id),
          eq(sitePrice.currencyCode, currencyCode),
          siteId ? eq(sitePrice.siteId, siteId) : sql`false`,
        ),
      )
      .leftJoin(
        orgPrice,
        and(
          eq(orgPrice.catalogListingId, catalogListings.id),
          eq(orgPrice.currencyCode, currencyCode),
          isNull(orgPrice.siteId),
        ),
      )
      .where(and(eq(wishlistItems.appId, appId), eq(wishlistItems.partyId, partyId)))
      .orderBy(desc(wishlistItems.createdAt));

    return rows as WishlistItemRow[];
  }

  // Which products the party has saved in this storefront — ids only, no catalogue, no price
  async findVariantIdsForParty(appId: string, partyId: string): Promise<string[]> {
    const rows = await this.findMany({ where: { appId, partyId } });
    return rows.map((row) => row.offeringVariantId);
  }

  // Saves a product, or leaves the existing row alone
  async insertIgnoring(appId: string, partyId: string, offeringVariantId: string): Promise<WishlistItem | undefined> {
    const rows = (await this.db
      .insert(wishlistItems)
      .values({ appId, partyId, offeringVariantId })
      .onConflictDoNothing({
        target: [
          wishlistItems.organizationId,
          wishlistItems.appId,
          wishlistItems.partyId,
          wishlistItems.offeringVariantId,
        ],
      })
      .returning()) as WishlistItem[];
    return rows[0];
  }

  async deleteForParty(appId: string, partyId: string, offeringVariantId: string): Promise<number> {
    const { count } = await this.deleteMany(
      and(
        eq(wishlistItems.appId, appId),
        eq(wishlistItems.partyId, partyId),
        eq(wishlistItems.offeringVariantId, offeringVariantId),
      ) as SQL,
    );
    return count;
  }

  // Empties the list in one statement — the whole point of clearing it
  async deleteAllForParty(appId: string, partyId: string): Promise<number> {
    const { count } = await this.deleteMany(
      and(eq(wishlistItems.appId, appId), eq(wishlistItems.partyId, partyId)) as SQL,
    );
    return count;
  }

  // Everything a person has saved, across every storefront
  async findAllForParty(partyId: string, currencyCode: string): Promise<(WishlistItemRow & { appId: string })[]> {
    const rows = await this.db
      .select({
        id: wishlistItems.id,
        appId: wishlistItems.appId,
        catalogListingId: catalogListings.id,
        offeringVariantId: wishlistItems.offeringVariantId,
        amount: catalogListingPrices.amount,
        currencyCode: catalogListingPrices.currencyCode,
        sku: offeringVariants.sku,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(offeringVariants, eq(offeringVariants.id, wishlistItems.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, wishlistItems.offeringVariantId),
          eq(
            catalogListings.catalogId,
            partyChannelCatalogId(sql`${wishlistItems.partyId}`, sql`${wishlistItems.appId}`),
          ),
        ),
      )
      .leftJoin(
        catalogListingPrices,
        and(
          eq(catalogListingPrices.catalogListingId, catalogListings.id),
          eq(catalogListingPrices.currencyCode, currencyCode),
          isNull(catalogListingPrices.siteId),
        ),
      )
      .where(eq(wishlistItems.partyId, partyId))
      .orderBy(desc(wishlistItems.createdAt));

    return rows as (WishlistItemRow & { appId: string })[];
  }

  // Whether this organization has such a product at all
  async variantExists(offeringVariantId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: offeringVariants.id })
      .from(offeringVariants)
      .where(eq(offeringVariants.id, offeringVariantId))
      .limit(1);
    return rows.length > 0;
  }
}
