import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, desc, eq, isNull, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  catalogChannels,
  catalogListingPrices,
  catalogListings,
  offerings,
  offeringVariants,
  type WishlistItem,
  wishlistItems,
} from '@/db/schema';
import type { WishlistItemRow } from '../dto/entity/wishlist.dto';

@Injectable()
export class WishlistDomainRepository extends PrimaryBaseRepository<typeof wishlistItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, wishlistItems);
  }

  /**
   * One shopper's wishlist in one storefront, newest first.
   *
   * The row stores the product; which catalogue offers it, and at what, is answered per read. The
   * listing join is `left` so something the shop has since stopped listing still shows on the list
   * and reports itself unavailable — outliving what it points at is the point of a wishlist.
   *
   * Two price joins rather than one: the outlet's own price wins and the organization-wide row is
   * the fallback. A single join matching both would return the row twice.
   */
  async findForParty(
    appId: string,
    partyId: string,
    currencyCode: string,
    catalogId: string,
    siteId?: string,
  ): Promise<WishlistItemRow[]> {
    const sitePrice = aliasedTable(catalogListingPrices, 'site_price');
    const orgPrice = aliasedTable(catalogListingPrices, 'org_price');

    const rows = await this.db
      .select({
        id: wishlistItems.id,
        catalogListingId: catalogListings.id,
        offeringVariantId: wishlistItems.offeringVariantId,
        amount: sql<bigint | null>`coalesce(${sitePrice.amount}, ${orgPrice.amount})`,
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
          eq(catalogListings.catalogId, catalogId),
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

  /**
   * Saves a product, or leaves the existing row alone.
   *
   * `do nothing` on the unique rather than a read-then-write: favouriting twice is the same
   * thing, and two taps in flight would otherwise race. Returns nothing on a conflict, which
   * the service reads as "already there" — an outcome, not a failure.
   */
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

  /** Empties the list in one statement — the whole point of clearing it. */
  async deleteAllForParty(appId: string, partyId: string): Promise<number> {
    const { count } = await this.deleteMany(
      and(eq(wishlistItems.appId, appId), eq(wishlistItems.partyId, partyId)) as SQL,
    );
    return count;
  }

  /**
   * Everything a person has saved, across every storefront.
   *
   * The staff view, so there is no single catalogue to price against — each row is priced through
   * its own storefront's APP channel, which `app_id` identifies. That join is why the caller need
   * not resolve a channel per row itself.
   */
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
        catalogChannels,
        and(eq(catalogChannels.appId, wishlistItems.appId), sql`${catalogChannels.type} = 'APP'`),
      )
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, wishlistItems.offeringVariantId),
          eq(catalogListings.catalogId, catalogChannels.catalogId),
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

  /** The listing that sells a variant in a catalogue, or nothing when it does not carry it. */
  async findListingForVariant(catalogId: string, offeringVariantId: string): Promise<string | undefined> {
    const rows = await this.db
      .select({ id: catalogListings.id })
      .from(catalogListings)
      .where(and(eq(catalogListings.catalogId, catalogId), eq(catalogListings.offeringVariantId, offeringVariantId)))
      .limit(1);
    return rows[0]?.id;
  }
}
