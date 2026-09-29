import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { cartItems, carts, offeringVariants, parties } from '@/db/schema';
import { CartDetailDto, CartDto, CartItemDto, StaffCartItemDto } from '../dto/entity/cart.dto';
import { CartsDomainRepository } from '../repositories/carts.repository';

/** The bound the `ck_cart_items_quantity` CHECK enforces. Kept in step with it by hand. */
const MAX_QUANTITY = 99;

/**
 * A shopper's basket at an outlet.
 *
 * A shopper-facing caller names the **party**, never a basket, and that is the security shape of the
 * feature: the cart is found from the party and the request's workspace, so there is no id a caller
 * could change to reach someone else's. Staff name a `cartId`, because a person may hold one at each
 * outlet and "their basket" is then a question with more than one answer.
 *
 * Nothing is minted on a read. A shopper who has added nothing has no cart, and that reads as an
 * empty basket rather than a row to create.
 */
@Injectable()
export class CartsDomainService {
  private readonly logger = new Logger(CartsDomainService.name);

  /** What the table may filter, search and sort on. */
  private static readonly FIELD_MAP: FieldMap = {
    partyName: { column: parties.displayName, type: 'string' },
    createdAt: { column: carts.createdAt, type: 'string' },
    updatedAt: { column: carts.updatedAt, type: 'string' },
  };

  /** What the items table may filter, search and sort on. */
  private static readonly ITEM_FIELD_MAP: FieldMap = {
    name: { column: offeringVariants.name, type: 'string' },
    sku: { column: offeringVariants.sku, type: 'string' },
    quantity: { column: cartItems.quantity, type: 'number' },
    createdAt: { column: cartItems.createdAt, type: 'string' },
  };

  constructor(private readonly repository: CartsDomainRepository) {}

  /** The baskets open at this workspace. */
  async findForTable(state: TableViewState): Promise<{ result: CartDetailDto[]; count: number }> {
    const where =
      and(
        FilterProcessor.buildWhere(state.filters, CartsDomainService.FIELD_MAP),
        FilterProcessor.buildSearch(state.search, CartsDomainService.FIELD_MAP),
      ) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CartsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(carts.updatedAt)],
      limit,
      offset,
    });

    return { result: result.map((row) => CartDetailDto.from(row)), count };
  }

  /** One basket. */
  async findById(id: string): Promise<CartDetailDto> {
    const cart = await this.repository.findByIdWithParty(id);
    if (!cart) throw new NotFoundException('Basket not found.');
    return CartDetailDto.from(cart);
  }

  /** Its lines, priced by the catalogue the caller sells from. */
  async findItemsById(id: string, currencyCode: string, catalogId?: string, siteId?: string): Promise<CartDto> {
    const items = await this.repository.findItems(id, currencyCode, catalogId, siteId);
    return CartDto.from(currencyCode, items);
  }

  /** One basket's items for the data table, priced by the reader's catalogue when they have one. */
  async findItemsForTable(
    cartId: string,
    state: TableViewState,
    currencyCode: string,
    catalogId?: string,
    siteId?: string,
  ): Promise<{ result: CartItemDto[]; count: number }> {
    const where =
      and(
        FilterProcessor.buildWhere(state.filters, CartsDomainService.ITEM_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, CartsDomainService.ITEM_FIELD_MAP),
      ) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CartsDomainService.ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForTable(
      cartId,
      { where, orderBy, limit, offset },
      currencyCode,
      catalogId,
      siteId,
    );
    return { result: result.map((row) => CartItemDto.from(row)), count };
  }

  /**
   * Opens a basket for a shopper.
   *
   * They may already have one here — the unique says so — which is an outcome to report rather than
   * a failure: staff asked for their basket and there it is. The insert decides that, not a read
   * before it: checking first and inserting after is a race two tills can lose.
   */
  async create(input: { partyId: string }): Promise<CreateResponseDto<CartDetailDto>> {
    const { cart, opened } = await this.repository.findOrCreateForParty(input.partyId);
    if (opened) this.logger.log(`cart ${cart.id} opened for party ${input.partyId}`);

    // The one read that earns its keep: the shopper's name lives on `parties`, and the caller wants
    // to show whose basket this is.
    return {
      success: true,
      message: opened ? 'Basket opened.' : 'They already have a basket here.',
      data: await this.findById(cart.id),
    };
  }

  /** Closes a basket outright — the lines go with it. */
  async delete(id: string): Promise<SuccessResponseDto> {
    await this.findById(id);
    await this.repository.delete(id);
    return { success: true, message: 'Basket closed.' };
  }

  /** The basket, or an empty one. Never opens a cart. */
  async find(partyId: string, currencyCode: string, catalogId?: string, siteId?: string): Promise<CartDto> {
    const cart = await this.repository.findByParty(partyId);
    if (!cart) return CartDto.from(currencyCode, []);

    const items = await this.repository.findItems(cart.id, currencyCode, catalogId, siteId);
    return CartDto.from(currencyCode, items);
  }

  /** Adds a product to the basket, opening one if this is the shopper's first line here. */
  async addItem(input: {
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    catalogId?: string;
    siteId?: string;
  }): Promise<CartDto> {
    const quantity = this.requireQuantity(input.quantity);

    const { cart } = await this.repository.findOrCreateForParty(input.partyId);
    await this.repository.upsertItem(cart.id, input.offeringVariantId, quantity);
    this.logger.log(`cart ${cart.id} — party ${input.partyId} added ${input.offeringVariantId} x${quantity}`);

    return this.find(input.partyId, input.currencyCode, input.catalogId, input.siteId);
  }

  /** Sets a line to an exact quantity. Zero is not accepted — removing is its own operation. */
  async updateItem(input: {
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    catalogId?: string;
    siteId?: string;
  }): Promise<CartDto> {
    const quantity = this.requireQuantity(input.quantity);
    const cart = await this.requireCart(input.partyId);

    const updated = await this.repository.setItemQuantity(cart.id, input.offeringVariantId, quantity);
    if (!updated) throw new NotFoundException('That item is not in your basket.');

    return this.find(input.partyId, input.currencyCode, input.catalogId, input.siteId);
  }

  async removeItem(
    partyId: string,
    offeringVariantId: string,
    currencyCode: string,
    catalogId?: string,
    siteId?: string,
  ): Promise<CartDto> {
    const cart = await this.requireCart(partyId);

    const removed = await this.repository.deleteItem(cart.id, offeringVariantId);
    if (removed === 0) throw new NotFoundException('That item is not in your basket.');

    return this.find(partyId, currencyCode, catalogId, siteId);
  }

  /**
   * Empties the basket, keeping it open.
   *
   * Checkout does not call this — it deletes the cart outright once the order exists, because the
   * order lines are then the record of what was bought.
   */
  async clear(partyId: string): Promise<SuccessResponseDto> {
    const cart = await this.repository.findByParty(partyId);
    if (cart) await this.repository.deleteAllItems(cart.id);
    return { success: true, message: 'Basket emptied.' };
  }

  /**
   * Every basket line a person holds, across every outlet.
   *
   * Each line carries the cart and the workspace that owns it, so staff can tell one outlet's basket
   * from another's — and so an edit below can name which.
   */
  async findAllForParty(
    partyId: string,
    currencyCode: string,
    catalogId?: string,
    siteId?: string,
  ): Promise<StaffCartItemDto[]> {
    const rows = await this.repository.findAllForParty(partyId, currencyCode, catalogId, siteId);
    return rows.map((row) => StaffCartItemDto.fromStaffRow(row));
  }

  /** Adds a line to one of the person's baskets, on their behalf. */
  async addItemForCart(input: {
    cartId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    catalogId?: string;
    siteId?: string;
  }): Promise<StaffCartItemDto[]> {
    const quantity = this.requireQuantity(input.quantity);

    await this.repository.upsertItem(input.cartId, input.offeringVariantId, quantity);
    this.logger.log(`cart ${input.cartId} — staff added ${input.offeringVariantId} x${quantity}`);
    return this.findAllForParty(input.partyId, input.currencyCode, input.catalogId, input.siteId);
  }

  /** Sets a line to an exact quantity on a shopper's behalf. */
  async updateItemForCart(input: {
    cartId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    catalogId?: string;
    siteId?: string;
  }): Promise<StaffCartItemDto[]> {
    const quantity = this.requireQuantity(input.quantity);
    const updated = await this.repository.setItemQuantity(input.cartId, input.offeringVariantId, quantity);
    if (!updated) throw new NotFoundException('That item is not in their basket.');
    return this.findAllForParty(input.partyId, input.currencyCode, input.catalogId, input.siteId);
  }

  /** Removes a line on a shopper's behalf. */
  async removeItemForCart(input: {
    cartId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    catalogId?: string;
    siteId?: string;
  }): Promise<StaffCartItemDto[]> {
    const removed = await this.repository.deleteItem(input.cartId, input.offeringVariantId);
    if (removed === 0) throw new NotFoundException('That item is not in their basket.');
    return this.findAllForParty(input.partyId, input.currencyCode, input.catalogId, input.siteId);
  }

  /** The shopper's basket here, or a refusal — for the operations that edit an existing line. */
  private async requireCart(partyId: string) {
    const cart = await this.repository.findByParty(partyId);
    if (!cart) throw new NotFoundException('That item is not in your basket.');
    return cart;
  }

  /**
   * Rejected here rather than left to the CHECK constraint.
   *
   * The database would raise a 23514 that surfaces as an opaque server error; a shopper who typed
   * 200 should be told the limit instead.
   */
  private requireQuantity(quantity: number): number {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new ConflictException({
        label: 'Invalid Quantity',
        detail: `Choose a quantity between 1 and ${MAX_QUANTITY}.`,
      });
    }
    return quantity;
  }
}
