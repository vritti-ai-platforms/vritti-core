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
  partyChannelCatalogId,
} from '@/db/schema';
import type { CartItemRow, CartTableRow } from '../dto/entity/cart.dto';

@Injectable()
export class CartsDomainRepository extends PrimaryBaseRepository<typeof carts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, carts);
  }

  // The party's open basket in this workspace, if they have one
  findByParty(partyId: string): Promise<Cart | undefined> {
    return this.findOne({ partyId });
  }

  // The party's basket, opening one if this is their first line here, and whether it opened one
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

  // The shape of a priced basket line, ready for a `where` to narrow it
  private lineRows(currencyCode: string, appId?: string | null, siteId?: string) {
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
          eq(catalogListings.catalogId, partyChannelCatalogId(sql`${carts.partyId}`, appId)),
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
  async findItems(
    cartId: string,
    currencyCode: string,
    appId?: string | null,
    siteId?: string,
  ): Promise<CartItemRow[]> {
    const rows = await this.lineRows(currencyCode, appId, siteId)
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.createdAt));
    return rows as CartItemRow[];
  }

  // One basket's items for the data table — filtered, sorted and paged by the table's own state
  async findItemsForTable(
    cartId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
    currencyCode: string,
    appId?: string | null,
    siteId?: string,
  ): Promise<{ result: CartItemRow[]; count: number }> {
    const where = and(eq(cartItems.cartId, cartId), options.where);

    const [rows, [total]] = await Promise.all([
      this.lineRows(currencyCode, appId, siteId)
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

  // How many of each product a party holds in their basket here — what a product page draws its quantity stepper from
  async findQuantitiesForParty(partyId: string): Promise<{ offeringVariantId: string; quantity: number }[]> {
    return this.db
      .select({ offeringVariantId: cartItems.offeringVariantId, quantity: cartItems.quantity })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .where(and(eq(carts.partyId, partyId), ownedByWorkspaceExpression()));
  }

  // Adds a line, or raises the quantity of the one already there
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

  // Empties a basket without closing it — the cart row survives for the shopper to fill again
  async deleteAllItems(cartId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Every line a person holds that this workspace can reach
  async findAllForParty(
    partyId: string,
    currencyCode: string,
    appId?: string | null,
    siteId?: string,
  ): Promise<(CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string })[]> {
    const rows = await this.lineRows(currencyCode, appId, siteId)
      .where(eq(carts.partyId, partyId))
      .orderBy(asc(cartItems.createdAt));
    return rows as (CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string })[];
  }

  // The baskets open at this workspace, for the staff table
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

  // One basket with the shopper it belongs to, or nothing when this workspace cannot reach it
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
