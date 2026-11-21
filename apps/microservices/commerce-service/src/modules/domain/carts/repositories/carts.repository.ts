import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, gt, lte, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type Cart,
  type CartItem,
  cartItems,
  carts,
  offeringVariants,
  ownedByWorkspaceExpression,
  parties,
} from '@/db/schema';
import type { CartTableRow } from '../dto/entity/cart.dto';

export type CartCounts = {
  itemCount: number;
};

@Injectable()
export class CartsDomainRepository extends PrimaryBaseRepository<typeof carts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, carts);
  }

  // The party's open cart in this workspace, if they have one
  findByParty(partyId: string): Promise<Cart | undefined> {
    return this.findOne({ partyId });
  }

  // The party's cart, opening one if this is their first line here, and whether it opened one
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
    throw new Error(`Could not open a cart for party ${partyId}`);
  }

  // How many of each product a party holds in their cart here — what a product page draws its quantity stepper from
  async findQuantitiesForParty(partyId: string): Promise<{ code: string; quantity: number }[]> {
    return this.db
      .select({ code: cartItems.code, quantity: cartItems.quantity })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .where(and(eq(carts.partyId, partyId), ownedByWorkspaceExpression(carts)));
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

  // Empties a cart without closing it — the cart row survives for the shopper to fill again
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

  // Counts a cart's lines, throwing when this workspace cannot reach it
  async findCountsOrThrow(id: string): Promise<CartCounts> {
    const counts = await this.findById<CartCounts>(id, { select: this.counts() });
    if (!counts) throw new NotFoundException('Cart not found.');
    return counts;
  }

  // The carts open at this workspace, for the staff table
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

  // One cart with the shopper it belongs to, or nothing when this workspace cannot reach it
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

  // Counts the rows each of a cart's tabs lists: its lines
  private counts() {
    return {
      itemCount: this.db.$count(cartItems, eq(cartItems.cartId, carts.id)),
    };
  }
}
