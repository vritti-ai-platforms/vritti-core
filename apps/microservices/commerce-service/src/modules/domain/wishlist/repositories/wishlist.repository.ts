import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  catalogListingPrices,
  catalogListings,
  listingPriceSpecificity,
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

  // The price that applies to the reader: reach narrows the rows to the ones this workspace inherits,
  // and the narrowest of those wins — the same precedence the storefront listing resolves with.
  private priceLateral(currencyCode: string) {
    return this.db
      .select({ amount: catalogListingPrices.amount, currencyCode: catalogListingPrices.currencyCode })
      .from(catalogListingPrices)
      .where(
        and(
          eq(catalogListingPrices.catalogListingId, catalogListings.id),
          eq(catalogListingPrices.currencyCode, currencyCode),
        ),
      )
      .orderBy(desc(listingPriceSpecificity))
      .limit(1)
      .as('price');
  }

  // One shopper's wishlist in one storefront, newest first
  async findForParty(appId: string, partyId: string, currencyCode: string): Promise<WishlistItemRow[]> {
    const price = this.priceLateral(currencyCode);

    const rows = await this.db
      .select({
        id: wishlistItems.id,
        catalogListingId: catalogListings.id,
        offeringVariantId: offeringVariants.id,
        amount: price.amount,
        currencyCode: price.currencyCode,
        code: offeringVariants.code,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(
        offeringVariants,
        and(
          eq(offeringVariants.organizationId, wishlistItems.organizationId),
          eq(offeringVariants.code, wishlistItems.code),
        ),
      )
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, offeringVariants.id),
          eq(catalogListings.catalogId, partyChannelCatalogId(partyId, appId)),
        ),
      )
      .leftJoinLateral(price, sql`true`)
      .where(and(eq(wishlistItems.appId, appId), eq(wishlistItems.partyId, partyId)))
      .orderBy(desc(wishlistItems.createdAt));

    return rows as WishlistItemRow[];
  }

  // Which products the party has saved in this storefront — codes only, no catalogue, no price
  async findCodesForParty(appId: string, partyId: string): Promise<string[]> {
    const rows = (await this.db
      .select({ code: wishlistItems.code })
      .from(wishlistItems)
      .where(and(eq(wishlistItems.appId, appId), eq(wishlistItems.partyId, partyId)))) as { code: string }[];
    return rows.map((row) => row.code);
  }

  // Saves a product, or leaves the existing row alone
  async insertIgnoring(appId: string, partyId: string, code: string): Promise<WishlistItem | undefined> {
    const rows = (await this.db
      .insert(wishlistItems)
      .values({ appId, partyId, code })
      .onConflictDoNothing({
        target: [wishlistItems.organizationId, wishlistItems.appId, wishlistItems.partyId, wishlistItems.code],
      })
      .returning()) as WishlistItem[];
    return rows[0];
  }

  async deleteForParty(appId: string, partyId: string, code: string): Promise<number> {
    const { count } = await this.deleteMany(
      and(eq(wishlistItems.appId, appId), eq(wishlistItems.partyId, partyId), eq(wishlistItems.code, code)) as SQL,
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
    const price = this.priceLateral(currencyCode);

    const rows = await this.db
      .select({
        id: wishlistItems.id,
        appId: wishlistItems.appId,
        catalogListingId: catalogListings.id,
        offeringVariantId: offeringVariants.id,
        amount: price.amount,
        currencyCode: price.currencyCode,
        code: offeringVariants.code,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(
        offeringVariants,
        and(
          eq(offeringVariants.organizationId, wishlistItems.organizationId),
          eq(offeringVariants.code, wishlistItems.code),
        ),
      )
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, offeringVariants.id),
          eq(
            catalogListings.catalogId,
            partyChannelCatalogId(sql`${wishlistItems.partyId}`, sql`${wishlistItems.appId}`),
          ),
        ),
      )
      .leftJoinLateral(price, sql`true`)
      .where(eq(wishlistItems.partyId, partyId))
      .orderBy(desc(wishlistItems.createdAt));

    return rows as (WishlistItemRow & { appId: string })[];
  }

  // Whether this organization has such a product at all
}
