import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, eq, isNull, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type Cart,
  type CartItem,
  cartItems,
  carts,
  catalogChannels,
  catalogListingPrices,
  catalogListings,
  offerings,
  offeringVariants,
  parties,
} from '@/db/schema';
import type { CartItemRow, CartTableRow } from '../dto/entity/cart.dto';

/**
 * A basket and its lines.
 *
 * Only what the base repository cannot express lives here: the upsert on a **partial** unique, the
 * reads that join `parties` or the catalogue for a price, and everything touching `cart_items` —
 * a different table from this repository's own, so the inherited CRUD does not reach it.
 *
 * The aggregate root is `carts`, so this repository extends it and the lines hang off a cart id
 * rather than off the shopper — which is what lets one person hold a basket at every outlet at once.
 *
 * **No workspace argument anywhere.** `carts` owns `legal_entity_id` / `site_id`, so the request's
 * workspace decides what a read returns and where a write lands, enforced by RLS rather than by a
 * `where` a caller could forget. `cart_items` carries no scope columns of its own and derives its
 * own through the parent.
 */
@Injectable()
export class CartsDomainRepository extends PrimaryBaseRepository<typeof carts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, carts);
  }

  /** The party's open basket in this workspace, if they have one. */
  findByParty(partyId: string): Promise<Cart | undefined> {
    return this.findOne({ partyId });
  }

  /**
   * The party's basket, opening one if this is their first line here, and whether it opened one.
   *
   * `do nothing` on the partial unique rather than read-then-write: two taps in flight would
   * otherwise both find nothing and both insert. A conflict returns no row, which is the signal to
   * read the one that won.
   */
  async findOrCreateForParty(partyId: string, channelId?: string): Promise<{ cart: Cart; opened: boolean }> {
    const inserted = (await this.db
      .insert(carts)
      .values({ partyId, channelId })
      .onConflictDoNothing({
        target: [carts.organizationId, carts.legalEntityId, carts.siteId, carts.partyId],
      })
      .returning()) as Cart[];

    // A returned row means this statement is what created it. A conflict returns nothing, which is
    // the signal that they already had one — an outcome worth reporting, not a failure.
    if (inserted[0]) return { cart: inserted[0], opened: true };

    const existing = await this.findByParty(partyId);
    if (existing) return { cart: existing, opened: false };
    throw new Error(`Could not open a basket for party ${partyId}`);
  }

  /**
   * Every line of one basket, priced by the catalogue the caller sells from.
   *
   * The line stores the product; which catalogue offers it, and at what, is answered per read. The
   * listing join is `left` so a variant this catalogue no longer lists still shows in the basket and
   * reports itself unavailable rather than vanishing from under the shopper.
   *
   * Two price joins rather than one: the outlet's own price wins, and the organization-wide row is
   * the fallback. A single join matching both would return the line twice.
   */
  async findItems(cartId: string, currencyCode: string, catalogId: string, siteId?: string): Promise<CartItemRow[]> {
    const sitePrice = aliasedTable(catalogListingPrices, 'site_price');
    const orgPrice = aliasedTable(catalogListingPrices, 'org_price');

    const rows = await this.db
      .select({
        id: cartItems.id,
        catalogListingId: catalogListings.id,
        offeringVariantId: cartItems.offeringVariantId,
        quantity: cartItems.quantity,
        amount: sql<bigint | null>`coalesce(${sitePrice.amount}, ${orgPrice.amount})`,
        currencyCode: sql<string | null>`coalesce(${sitePrice.currencyCode}, ${orgPrice.currencyCode})`,
        sku: offeringVariants.sku,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: cartItems.createdAt,
      })
      .from(cartItems)
      .innerJoin(offeringVariants, eq(offeringVariants.id, cartItems.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, cartItems.offeringVariantId),
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
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.createdAt));

    return rows as CartItemRow[];
  }

  /**
   * Adds a line, or raises the quantity of the one already there.
   *
   * The unique on `(cart, variant)` is the idempotency key, so two taps in flight settle into one
   * row with the right total instead of racing to read-then-write. The CHECK caps it at 99, so
   * `least(...)` keeps a legitimate add from failing the statement when it would tip the line over.
   */
  async upsertItem(cartId: string, offeringVariantId: string, quantity: number): Promise<CartItem> {
    const rows = (await this.db
      .insert(cartItems)
      .values({ cartId, offeringVariantId, quantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.offeringVariantId],
        set: { quantity: sql`least(${cartItems.quantity} + ${quantity}, 99)`, updatedAt: new Date() },
      })
      .returning()) as CartItem[];
    return rows[0];
  }

  async setItemQuantity(cartId: string, offeringVariantId: string, quantity: number): Promise<CartItem | undefined> {
    const rows = (await this.db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.offeringVariantId, offeringVariantId)))
      .returning()) as CartItem[];
    return rows[0];
  }

  async deleteItem(cartId: string, offeringVariantId: string): Promise<number> {
    const rows = (await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.offeringVariantId, offeringVariantId)))
      .returning({ id: cartItems.id })) as { id: string }[];
    return rows.length;
  }

  /** Empties a basket without closing it — the cart row survives for the shopper to fill again. */
  async deleteAllItems(cartId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  /**
   * Every line a person holds, across every outlet.
   *
   * The staff view. What widens it is the workspace, not the predicate: `workspaceHierarchyPolicies`
   * on `carts` lets a parent see what its children own, so an org request sees every site's basket
   * while a site still sees only its own.
   *
   * Each basket is priced through the channel it was opened at, which is why `carts` records one —
   * resolving a channel per row here would otherwise mean a lateral join per line.
   */
  async findAllForParty(
    partyId: string,
    currencyCode: string,
  ): Promise<(CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string })[]> {
    const sitePrice = aliasedTable(catalogListingPrices, 'site_price');
    const orgPrice = aliasedTable(catalogListingPrices, 'org_price');

    const rows = await this.db
      .select({
        id: cartItems.id,
        cartId: carts.id,
        siteId: carts.siteId,
        legalEntityId: carts.legalEntityId,
        catalogListingId: catalogListings.id,
        offeringVariantId: cartItems.offeringVariantId,
        quantity: cartItems.quantity,
        amount: sql<bigint | null>`coalesce(${sitePrice.amount}, ${orgPrice.amount})`,
        currencyCode: sql<string | null>`coalesce(${sitePrice.currencyCode}, ${orgPrice.currencyCode})`,
        sku: offeringVariants.sku,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: cartItems.createdAt,
      })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .innerJoin(offeringVariants, eq(offeringVariants.id, cartItems.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(catalogChannels, eq(catalogChannels.id, carts.channelId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, cartItems.offeringVariantId),
          eq(catalogListings.catalogId, catalogChannels.catalogId),
        ),
      )
      .leftJoin(
        sitePrice,
        and(
          eq(sitePrice.catalogListingId, catalogListings.id),
          eq(sitePrice.currencyCode, currencyCode),
          eq(sitePrice.siteId, carts.siteId),
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
      .where(eq(carts.partyId, partyId))
      .orderBy(asc(cartItems.createdAt));

    return rows as (CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string })[];
  }

  /**
   * The baskets open at this workspace, for the staff table.
   *
   * `itemCount` is a correlated count rather than a join with a group-by: the table pages, and
   * grouping would have to page over the join instead of over the baskets.
   */
  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: CartTableRow[];
    count: number;
  }> {
    return this.findAllAndCount<CartTableRow>({
      select: {
        id: carts.id,
        organizationId: carts.organizationId,
        legalEntityId: carts.legalEntityId,
        siteId: carts.siteId,
        partyId: carts.partyId,
        partyName: parties.displayName,
        channelId: carts.channelId,
        checkoutStartedAt: carts.checkoutStartedAt,
        itemCount: sql<number>`(select count(*) from ${cartItems} where ${cartItems.cartId} = ${carts.id})`,
        createdAt: carts.createdAt,
        updatedAt: carts.updatedAt,
      },
      leftJoins: [{ table: parties, on: eq(parties.id, carts.partyId) }],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  /** One basket with the shopper it belongs to, or nothing when this workspace cannot reach it. */
  async findByIdWithParty(id: string): Promise<CartTableRow | undefined> {
    const rows = (await this.db
      .select({
        id: carts.id,
        organizationId: carts.organizationId,
        legalEntityId: carts.legalEntityId,
        siteId: carts.siteId,
        partyId: carts.partyId,
        partyName: parties.displayName,
        channelId: carts.channelId,
        checkoutStartedAt: carts.checkoutStartedAt,
        itemCount: sql<number>`(select count(*) from ${cartItems} where ${cartItems.cartId} = ${carts.id})`,
        createdAt: carts.createdAt,
        updatedAt: carts.updatedAt,
      })
      .from(carts)
      .leftJoin(parties, eq(parties.id, carts.partyId))
      .where(eq(carts.id, id))
      .limit(1)) as CartTableRow[];
    return rows[0];
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
