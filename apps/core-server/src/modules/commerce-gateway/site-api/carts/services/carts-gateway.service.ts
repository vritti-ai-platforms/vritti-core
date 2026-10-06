import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

export interface CartRow {
  id: string;
  siteId: string | null;
  legalEntityId: string | null;
  partyId: string;
  partyName: string;
  checkoutStartedAt: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartTableResponse {
  result: CartRow[];
  count: number;
  state: unknown;
  activeViewId: string | null;
}

export interface CartLineRow {
  id: string;
  catalogListingId: string | null;
  offeringVariantId: string;
  quantity: number;
  name: string;
  sku: string | null;
  unitPrice: { currency: string; value: string } | null;
  lineTotal: { currency: string; value: string } | null;
  isAvailable: boolean;
}

export interface CartItemsTableResponse {
  result: CartLineRow[];
  count: number;
  state: unknown;
  activeViewId: string | null;
}

export interface CartLinesResponse {
  currencyCode: string;
  items: CartLineRow[];
  subtotal: { currency: string; value: string };
  itemCount: number;
}

export interface CartItemPayload {
  id: string;
  catalogListingId: string | null;
  offeringVariantId: string;
  quantity: number;
  name: string;
  sku: string | null;
  unitPrice: { currency: string; value: string } | null;
  lineTotal: { currency: string; value: string } | null;
  isAvailable: boolean;
}

export interface CartPayload {
  currencyCode: string;
  items: CartItemPayload[];
  subtotal: { currency: string; value: string };
  itemCount: number;
}

@Injectable()
export class CartsGatewayService {
  private readonly logger = new Logger(CartsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted baskets for the data table
  async findForTable(userId: string): Promise<CartTableResponse> {
    this.logger.log('site.carts.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-site-carts');

    const { result, count } = await this.nats.send<{ result: CartRow[]; count: number }>(
      'commerce',
      'site.carts.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns a single basket by ID
  async findById(id: string): Promise<CartRow> {
    this.logger.log(`site.carts.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.findById', { id });
  }

  // Returns a basket's lines, priced through this site's channel
  async findItems(id: string, currencyCode: string, siteId?: string): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.findItemsById', { id, currencyCode, appId: null, siteId });
  }

  // Returns paginated, filtered and sorted items of one basket for the data table
  async findItemsForTable(
    cartId: string,
    userId: string,
    currencyCode: string,
    siteId?: string,
  ): Promise<CartItemsTableResponse> {
    this.logger.log(`site.carts.items.table — cart: ${cartId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-cart-${cartId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: CartLineRow[]; count: number }>(
      'commerce',
      'site.carts.items.table',
      { cartId, currencyCode, appId: null, siteId, ...(state as object) },
    );

    return { result, count, state, activeViewId };
  }

  // Opens a basket for a party, or hands back the one they already have here
  async create(input: { partyId: string }): Promise<CreateResponseDto<CartRow>> {
    this.logger.log(`site.carts.create — party: ${input.partyId}`);
    return this.nats.send('commerce', 'site.carts.create', { partyId: input.partyId });
  }

  // Closes a basket outright — the lines go with it
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.delete', { id });
  }

  async addItem(
    cartId: string,
    input: {
      partyId: string;
      offeringVariantId: string;
      quantity: number;
      currencyCode: string;
      siteId?: string;
    },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.addForCart — cart: ${cartId}, variant: ${input.offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.addForCart', { cartId, appId: null, ...input });
    return this.findItems(cartId, input.currencyCode, input.siteId);
  }

  async updateItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; quantity: number; currencyCode: string; siteId?: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.updateForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.updateForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode, input.siteId);
  }

  async removeItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; currencyCode: string; siteId?: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.removeForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.removeForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode, input.siteId);
  }

  // ── The party's own basket, for a storefront acting for one signed-in party ──
  //
  // The catalogue comes from the calling credential's APP channel, never from the caller, so a
  // storefront cannot reach a catalogue it does not sell even knowing a listing id. `appId` and
  // `partyId` arrive from `auth`, which the signature covers.

  async findPartyCart(appId: string, partyId: string, currencyCode: string, siteId?: string): Promise<CartPayload> {
    this.logger.log(`site.carts.get — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.get', { partyId, currencyCode, appId, siteId });
  }

  async addShopperItem(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    siteId?: string;
  }): Promise<CartPayload> {
    const { appId, ...cart } = input;
    this.logger.log(`site.carts.items.add — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'site.carts.items.add', { ...cart, appId });
  }

  async updateShopperItem(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    siteId?: string;
  }): Promise<CartPayload> {
    const { appId, ...cart } = input;
    this.logger.log(`site.carts.items.update — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'site.carts.items.update', { ...cart, appId });
  }

  async removeShopperItem(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<CartPayload> {
    const { appId, ...cart } = input;
    this.logger.log(`site.carts.items.remove — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'site.carts.items.remove', { ...cart, appId });
  }

  // How many of each product the party holds in their basket here — a count, no catalogue, no price
  findShopperQuantities(partyId: string): Promise<{ offeringVariantId: string; quantity: number }[]> {
    this.logger.log(`site.carts.quantities — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.quantities', { partyId });
  }

  clearShopperCart(partyId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.clear — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.clear', { partyId });
  }
}
