import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, gt, lte, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type Cart,
  type CartItem,
  cartItems,
  carts,
  catalogListingPrices,
  catalogListings,
  listingPriceSpecificity,
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

    // A returned row means this statement is what created it.
    if (inserted[0]) return { cart: inserted[0], opened: true };

    const existing = await this.findByParty(partyId);
    if (existing) return { cart: existing, opened: false };
    throw new Error(`Could not open a basket for party ${partyId}`);
  }

  // The shape of a priced basket line, ready for a `where` to narrow it
  private lineRows(currencyCode: string, appId?: string | null) {
    const price = this.priceLateral(currencyCode);

    return this.db
      .select({
        id: cartItems.id,
        cartId: carts.id,
        siteId: carts.siteId,
        legalEntityId: carts.legalEntityId,
        catalogListingId: catalogListings.id,
        offeringId: offeringVariants.offeringId,
        offeringVariantId: offeringVariants.id,
        quantity: cartItems.quantity,
        amount: price.amount,
        currencyCode: price.currencyCode,
        code: offeringVariants.code,
        variantName: offeringVariants.name,
        offeringName: offerings.name,
        listingActive: sql<boolean>`${catalogListings.id} is not null`,
        variantActive: offeringVariants.isActive,
        offeringActive: offerings.isActive,
        createdAt: cartItems.createdAt,
      })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .innerJoin(
        offeringVariants,
        and(eq(offeringVariants.organizationId, cartItems.organizationId), eq(offeringVariants.code, cartItems.code)),
      )
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(
        catalogListings,
        and(
          eq(catalogListings.offeringVariantId, offeringVariants.id),
          eq(catalogListings.catalogId, partyChannelCatalogId(sql`${carts.partyId}`, appId)),
        ),
      )
      .leftJoinLateral(price, sql`true`);
  }

  // The price that applies to the reader: reach narrows the rows to the ones this workspace inherits, and the narrowest
  // of those wins — the same precedence the storefront listing resolves with.
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

  // Every line of one basket
  async findItems(cartId: string, currencyCode: string, appId?: string | null): Promise<CartItemRow[]> {
    const rows = await this.lineRows(currencyCode, appId)
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
  ): Promise<{ result: CartItemRow[]; count: number }> {
    const where = and(eq(cartItems.cartId, cartId), options.where);

    const [rows, [total]] = await Promise.all([
      this.lineRows(currencyCode, appId)
        .where(where)
        .orderBy(...(options.orderBy?.length ? options.orderBy : [asc(cartItems.createdAt)]))
        .limit(options.limit)
        .offset(options.offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(cartItems)
        .innerJoin(
          offeringVariants,
          and(eq(offeringVariants.organizationId, cartItems.organizationId), eq(offeringVariants.code, cartItems.code)),
        )
        .where(where),
    ]);

    return { result: rows as CartItemRow[], count: Number(total?.count ?? 0) };
  }

  // How many of each product a party holds in their basket here — what a product page draws its quantity stepper from
  async findQuantitiesForParty(partyId: string): Promise<{ code: string; quantity: number }[]> {
    return this.db
      .select({ code: cartItems.code, quantity: cartItems.quantity })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .where(and(eq(carts.partyId, partyId), ownedByWorkspaceExpression()));
  }

  // Adds a line, or raises the quantity of the one already there
  async upsertItem(cartId: string, code: string, quantity: number): Promise<CartItem> {
    const rows = (await this.db
      .insert(cartItems)
      .values({ cartId, code, quantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.code],
        set: { quantity: sql`least(${cartItems.quantity} + ${quantity}, 99)`, updatedAt: new Date() },
      })
      .returning()) as CartItem[];
    return rows[0];
  }

  async setItemQuantity(cartId: string, code: string, quantity: number): Promise<CartItem | undefined> {
    const rows = (await this.db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.code, code)))
      .returning()) as CartItem[];
    return rows[0];
  }

  async deleteItem(cartId: string, code: string): Promise<number> {
    const rows = (await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.code, code)))
      .returning({ id: cartItems.id })) as { id: string }[];
    return rows.length;
  }

  // The code a variant id names.
  async findCodeByVariantId(offeringVariantId: string): Promise<string | undefined> {
    const rows = (await this.db
      .select({ code: offeringVariants.code })
      .from(offeringVariants)
      .where(eq(offeringVariants.id, offeringVariantId))
      .limit(1)) as { code: string }[];
    return rows[0]?.code;
  }

  // Empties a basket without closing it — the cart row survives for the shopper to fill again
  async deleteAllItems(cartId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Takes an ordered quantity off a line — the line goes when nothing of it is left
  async consumeItem(cartId: string, code: string, quantity: number): Promise<void> {
    const line = and(eq(cartItems.cartId, cartId), eq(cartItems.code, code));
    await this.db.delete(cartItems).where(and(line, lte(cartItems.quantity, quantity)));
    await this.db
      .update(cartItems)
      .set({ quantity: sql`${cartItems.quantity} - ${quantity}`, updatedAt: new Date() })
      .where(and(line, gt(cartItems.quantity, quantity)));
  }

  // Every line a person holds that this workspace can reach
  async findAllForParty(
    partyId: string,
    currencyCode: string,
    appId?: string | null,
  ): Promise<(CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string })[]> {
    const rows = await this.lineRows(currencyCode, appId)
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
