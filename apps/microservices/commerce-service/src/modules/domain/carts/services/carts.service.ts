import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { NatsHeaders } from '@vritti/api-sdk/nats';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { cartItems, carts, offerings, offeringVariants, parties } from '@/db/schema';
import { CartDetailDto, CartDto, CartItemDto, type CartItemRow, StaffCartItemDto } from '../dto/entity/cart.dto';
import type { CartSiteScopeDto } from '../dto/request/cart-request.dto';
import { CartsDomainRepository } from '../repositories/carts.repository';

// The bound the `ck_cart_items_quantity` CHECK enforces. Kept in step with it by hand
const MAX_QUANTITY = 99;

// The request's context moved to one site: its own legal entity and timezone, no group — the reach a cart is read under
function siteScope(headers: NatsHeaders, site: CartSiteScopeDto): NatsHeaders {
  return {
    ...headers,
    siteId: site.siteId,
    legalEntityId: site.legalEntityId,
    siteTimezone: site.timezone,
    siteGroupId: '',
    siteIds: '',
  };
}

@Injectable()
export class CartsDomainService {
  private readonly logger = new Logger(CartsDomainService.name);

  // What the table may filter, search and sort on
  private static readonly FIELD_MAP: FieldMap = {
    partyName: { column: parties.displayName, type: 'string' },
    createdAt: { column: carts.createdAt, type: 'string' },
    updatedAt: { column: carts.updatedAt, type: 'string' },
  };

  // What the items table may filter, search and sort on
  private static readonly ITEM_FIELD_MAP: FieldMap = {
    name: { column: offerings.name, type: 'string' },
    code: { column: offeringVariants.code, type: 'string' },
    quantity: { column: cartItems.quantity, type: 'number' },
    createdAt: { column: cartItems.createdAt, type: 'string' },
  };

  constructor(
    private readonly repository: CartsDomainRepository,
    private readonly db: PrimaryDatabaseService,
  ) {}

  // The carts open at this workspace
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

  // One cart
  async findById(id: string): Promise<CartDetailDto> {
    const cart = await this.repository.findByIdWithParty(id);
    if (!cart) throw new NotFoundException('Cart not found.');
    return CartDetailDto.from(cart);
  }

  // How many of each product the party holds in their cart at this workspace
  findQuantities(partyId: string): Promise<{ code: string; quantity: number }[]> {
    return this.repository.findQuantitiesForParty(partyId);
  }

  // Its lines, priced by the catalogue the caller reads from
  async findItemsById(id: string, currencyCode: string, appId?: string | null): Promise<CartDto> {
    const items = await this.repository.findItems(id, currencyCode, appId);
    return CartDto.from(currencyCode, items);
  }

  // One cart's items for the data table, priced by the reader's catalogue when they have one
  async findItemsForTable(
    cartId: string,
    state: TableViewState,
    currencyCode: string,
    appId?: string | null,
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
      appId,
    );
    return { result: result.map((row) => CartItemDto.from(row)), count };
  }

  // Opens a cart for a shopper
  async create(input: { partyId: string }): Promise<CreateResponseDto<CartDetailDto>> {
    const { cart, opened } = await this.repository.findOrCreateForParty(input.partyId);
    if (opened) this.logger.log(`cart ${cart.id} opened for party ${input.partyId}`);

    // The one read that earns its keep: the shopper's name lives on `parties`, and the caller wants to show whose
    // cart this is.
    return {
      success: true,
      message: opened ? 'Cart opened.' : 'They already have a cart here.',
      data: await this.findById(cart.id),
    };
  }

  // Closes a cart outright — the lines go with it
  async delete(id: string): Promise<SuccessResponseDto> {
    await this.findById(id);
    await this.repository.delete(id);
    return { success: true, message: 'Cart closed.' };
  }

  // The cart, or an empty one. Never opens a cart
  async find(partyId: string, currencyCode: string, appId?: string | null): Promise<CartDto> {
    const cart = await this.repository.findByParty(partyId);
    if (!cart) return CartDto.from(currencyCode, []);

    const items = await this.repository.findItems(cart.id, currencyCode, appId);
    return CartDto.from(currencyCode, items);
  }

  // Reads the party's cart at each site under that site's own reach, since a cart is site-owned and its prices
  // only resolve from the site's catalogue; sites with an empty cart are left out
  async findAtSites(
    partyId: string,
    currencyCode: string,
    appId: string | null | undefined,
    sites: CartSiteScopeDto[],
    headers: NatsHeaders,
  ): Promise<{ siteId: string; cart: CartDto }[]> {
    const carts: { siteId: string; cart: CartDto }[] = [];
    for (const site of sites) {
      const cart = await this.db.runWithRlsContext(siteScope(headers, site), () =>
        this.find(partyId, currencyCode, appId),
      );
      if (cart.items.length > 0) carts.push({ siteId: site.siteId, cart });
    }
    return carts;
  }

  // The lines of the party's cart at each site, priced as `find` prices them and read under that site's own reach —
  // what a checkout across stores freezes; sites with no lines are left out
  async findForCheckoutAtSites(
    partyId: string,
    currencyCode: string,
    appId: string | null | undefined,
    sites: CartSiteScopeDto[],
    headers: NatsHeaders,
  ): Promise<{ siteId: string; legalEntityId: string; cartId: string; lines: CartItemRow[] }[]> {
    const carts: { siteId: string; legalEntityId: string; cartId: string; lines: CartItemRow[] }[] = [];
    for (const site of sites) {
      const checkout = await this.db.runWithRlsContext(siteScope(headers, site), () =>
        this.findForCheckout(partyId, currencyCode, appId),
      );
      if (checkout && checkout.lines.length > 0) {
        carts.push({ siteId: site.siteId, legalEntityId: site.legalEntityId, ...checkout });
      }
    }
    return carts;
  }

  // The cart's lines priced exactly as `find` prices them, with the cart they sit in — what checkout snapshots
  async findForCheckout(
    partyId: string,
    currencyCode: string,
    appId?: string | null,
  ): Promise<{ cartId: string; lines: CartItemRow[] } | null> {
    const cart = await this.repository.findByParty(partyId);
    if (!cart) return null;
    return { cartId: cart.id, lines: await this.repository.findItems(cart.id, currencyCode, appId) };
  }

  // Takes paid-for quantities out of the shopper's cart, leaving anything added since checkout
  async consumeOrderedLines(partyId: string, lines: { code: string; quantity: number }[]): Promise<void> {
    const cart = await this.repository.findByParty(partyId);
    if (!cart) return;
    for (const line of lines) {
      await this.repository.consumeItem(cart.id, line.code, line.quantity);
    }
    this.logger.log(`cart ${cart.id} — consumed ${pluralize('paid line', lines.length, true)} for party ${partyId}`);
  }

  // Adds a product to the cart, opening one if this is the shopper's first line here
  async addItem(input: {
    partyId: string;
    code: string;
    quantity: number;
    currencyCode: string;
    appId?: string | null;
  }): Promise<CartDto> {
    const quantity = this.requireQuantity(input.quantity);

    const { cart } = await this.repository.findOrCreateForParty(input.partyId);
    await this.repository.upsertItem(cart.id, input.code, quantity);
    this.logger.log(`cart ${cart.id} — party ${input.partyId} added ${input.code} x${quantity}`);

    return this.find(input.partyId, input.currencyCode, input.appId);
  }

  // Sets a line to an exact quantity. Zero is not accepted — removing is its own operation
  async updateItem(input: {
    partyId: string;
    code: string;
    quantity: number;
    currencyCode: string;
    appId?: string | null;
  }): Promise<CartDto> {
    const quantity = this.requireQuantity(input.quantity);
    const cart = await this.requireCart(input.partyId);

    const updated = await this.repository.setItemQuantity(cart.id, input.code, quantity);
    if (!updated) throw new NotFoundException('That item is not in your cart.');

    return this.find(input.partyId, input.currencyCode, input.appId);
  }

  async removeItem(partyId: string, code: string, currencyCode: string, appId?: string | null): Promise<CartDto> {
    const cart = await this.requireCart(partyId);

    const removed = await this.repository.deleteItem(cart.id, code);
    if (removed === 0) throw new NotFoundException('That item is not in your cart.');

    return this.find(partyId, currencyCode, appId);
  }

  // Empties the cart, keeping it open
  async clear(partyId: string): Promise<SuccessResponseDto> {
    const cart = await this.repository.findByParty(partyId);
    if (cart) await this.repository.deleteAllItems(cart.id);
    return { success: true, message: 'Cart emptied.' };
  }

  // Every cart line a person holds, across every outlet
  async findAllForParty(partyId: string, currencyCode: string, appId?: string | null): Promise<StaffCartItemDto[]> {
    const rows = await this.repository.findAllForParty(partyId, currencyCode, appId);
    return rows.map((row) => StaffCartItemDto.fromStaffRow(row));
  }

  // Adds a line to one of the person's carts, on their behalf
  async addItemForCart(input: {
    cartId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    appId?: string | null;
  }): Promise<StaffCartItemDto[]> {
    const quantity = this.requireQuantity(input.quantity);

    await this.repository.upsertItem(input.cartId, await this.requireCode(input.offeringVariantId), quantity);
    this.logger.log(`cart ${input.cartId} — staff added ${input.offeringVariantId} x${quantity}`);
    return this.findAllForParty(input.partyId, input.currencyCode, input.appId);
  }

  // Sets a line to an exact quantity on a shopper's behalf
  async updateItemForCart(input: {
    cartId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    appId?: string | null;
  }): Promise<StaffCartItemDto[]> {
    const quantity = this.requireQuantity(input.quantity);
    const code = await this.requireCode(input.offeringVariantId);
    const updated = await this.repository.setItemQuantity(input.cartId, code, quantity);
    if (!updated) throw new NotFoundException('That item is not in their cart.');
    return this.findAllForParty(input.partyId, input.currencyCode, input.appId);
  }

  // Removes a line on a shopper's behalf
  async removeItemForCart(input: {
    cartId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    appId?: string | null;
  }): Promise<StaffCartItemDto[]> {
    const removed = await this.repository.deleteItem(input.cartId, await this.requireCode(input.offeringVariantId));
    if (removed === 0) throw new NotFoundException('That item is not in their cart.');
    return this.findAllForParty(input.partyId, input.currencyCode, input.appId);
  }

  // The shopper's cart here, or a refusal — for the operations that edit an existing line
  private async requireCart(partyId: string) {
    const cart = await this.repository.findByParty(partyId);
    if (!cart) throw new NotFoundException('That item is not in your cart.');
    return cart;
  }

  // Rejected here rather than left to the CHECK constraint Staff screens address a product by id; a line is keyed by
  // code, so the id is translated once at the edge.
  private async requireCode(offeringVariantId: string): Promise<string> {
    const code = await this.repository.findCodeByVariantId(offeringVariantId);
    if (!code) throw new NotFoundException('That product no longer exists.');
    return code;
  }

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
