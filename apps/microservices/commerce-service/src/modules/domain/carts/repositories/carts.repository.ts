import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, eq, isNull, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type Cart,
  type CartItem,
  cartItems,
  carts,
  catalogListingPrices,
  catalogListings,
  offerings,
  offeringVariants,
  ownedByWorkspaceExpression,
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
  async findOrCreateForParty(partyId: string): Promise<{ cart: Cart; opened: boolean }> {
    const inserted = (await this.db
      .insert(carts)
      .values({ partyId })
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
   * The shape of a priced basket line, ready for a `where` to narrow it.
   *
   * The catalogue is the reader's, not the basket's. A basket records no channel: what a line is
   * worth is a question about who is looking, so each read resolves its own workspace's range and
   * prices through that. With no catalogue the listing join matches nothing and every line comes
   * back priceless and unavailable, which is exactly what having no price list means — and is why
   * this is never an error.
   *
   * Both joins to the listing and the prices are `left`, so a variant the catalogue no longer lists
   * still shows in the basket and reports itself unavailable rather than vanishing from under the
   * shopper. Two price joins rather than one: the outlet's own price wins, the organization-wide row
   * is the fallback, and a single join matching both would return the line twice.
   */
  private lineRows(currencyCode: string, catalogId?: string, siteId?: string) {
    const sitePrice = aliasedTable(catalogListingPrices, 'site_price');
    const orgPrice = aliasedTable(catalogListingPrices, 'org_price');

    return this.db
      .select({
        id: cartItems.id,
        cartId: carts.id,
        siteId: carts.siteId,
        legalEntityId: carts.legalEntityId,
        catalogListingId: catalogListings.id,
        offeringVariantId: cartItems.offeringVariantId,
        quantity: cartItems.quantity,
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
        createdAt: cartItems.createdAt,
      })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .innerJoin(offeringVariants, eq(offeringVariants.id, cartItems.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, cartItems.offeringVariantId),
          catalogId ? eq(catalogListings.catalogId, catalogId) : sql`false`,
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
      );
  }

  // Every line of one basket
  async findItems(cartId: string, currencyCode: string, catalogId?: string, siteId?: string): Promise<CartItemRow[]> {
    const rows = await this.lineRows(currencyCode, catalogId, siteId)
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.createdAt));
    return rows as CartItemRow[];
  }

  /**
   * One basket's items for the data table — filtered, sorted and paged by the table's own state.
   *
   * `findAllAndCount` is bound to `carts`, this repository's table, so the page and its count are
   * built here. The count joins the variant because a search on name or SKU narrows by it; it skips
   * the listing and price joins, which cannot change how many items there are.
   */
  async findItemsForTable(
    cartId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
    currencyCode: string,
    catalogId?: string,
    siteId?: string,
  ): Promise<{ result: CartItemRow[]; count: number }> {
    const where = and(eq(cartItems.cartId, cartId), options.where);

    const [rows, [total]] = await Promise.all([
      this.lineRows(currencyCode, catalogId, siteId)
        .where(where)
        .orderBy(...(options.orderBy?.length ? options.orderBy : [asc(cartItems.createdAt)]))
        .limit(options.limit)
        .offset(options.offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(cartItems)
        .innerJoin(offeringVariants, eq(offeringVariants.id, cartItems.offeringVariantId))
        .where(where),
    ]);

    return { result: rows as CartItemRow[], count: Number(total?.count ?? 0) };
  }

  /**
   * How many of each product a party holds in their basket here — what a product page draws its
   * quantity stepper from.
   *
   * The basket at exactly this workspace. RLS alone also lets a site read the baskets its legal
   * entity holds, and a stepper counting those would offer to change a line in a basket the shopper
   * is not shopping from. No catalogue and no price: the stepper needs a count, nothing else.
   */
  async findQuantitiesForParty(partyId: string): Promise<{ offeringVariantId: string; quantity: number }[]> {
    return this.db
      .select({ offeringVariantId: cartItems.offeringVariantId, quantity: cartItems.quantity })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .where(and(eq(carts.partyId, partyId), ownedByWorkspaceExpression()));
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
   * Every line a person holds that this workspace can reach.
   *
   * The staff view. What bounds it is the workspace, not the predicate: `workspaceScopePolicies` on
   * `carts` reads upward only, so a site sees its own baskets and its company's, while a company sees
   * only the ones it holds itself — never a basket one of its outlets is holding. Every line is priced through the reader's own catalogue,
   * so a basket filled at an outlet the reader does not sell from comes back unpriced rather than
   * wrong — the honest answer to "what is this worth to me".
   */
  async findAllForParty(
    partyId: string,
    currencyCode: string,
    catalogId?: string,
    siteId?: string,
  ): Promise<(CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string })[]> {
    const rows = await this.lineRows(currencyCode, catalogId, siteId)
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
        checkoutStartedAt: carts.checkoutStartedAt,
        itemCount: sql<number>`(select count(*) from ${cartItems} where ${cartItems.cartId} = ${carts}.id)`,
        createdAt: carts.createdAt,
        updatedAt: carts.updatedAt,
      },
      innerJoins: [{ table: parties, on: eq(parties.id, carts.partyId) }],
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
        checkoutStartedAt: carts.checkoutStartedAt,
        itemCount: sql<number>`(select count(*) from ${cartItems} where ${cartItems.cartId} = ${carts}.id)`,
        createdAt: carts.createdAt,
        updatedAt: carts.updatedAt,
      })
      .from(carts)
      .innerJoin(parties, eq(parties.id, carts.partyId))
      .where(eq(carts.id, id))
      .limit(1)) as CartTableRow[];
    return rows[0];
  }
}
