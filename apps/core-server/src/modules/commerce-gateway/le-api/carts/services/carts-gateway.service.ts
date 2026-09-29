import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

/** One basket as the table and the detail header read it. */
export interface CartRow {
  id: string;
  siteId: string | null;
  legalEntityId: string | null;
  partyId: string | null;
  partyName: string | null;
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

/** One line of a basket, priced by the catalogue this site sells from. */
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

/**
 * Baskets the company holds itself.
 *
 * Reach runs upward only, so an outlet's baskets are the outlet's — they do not appear here. Lines
 * are priced through the company's own channel, resolved per read.
 */
@Injectable()
export class LeCartsGatewayService {
  private readonly logger = new Logger(LeCartsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted baskets for the data table
  async findForTable(userId: string): Promise<CartTableResponse> {
    this.logger.log('le.carts.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-le-carts');

    const { result, count } = await this.nats.send<{ result: CartRow[]; count: number }>(
      'commerce',
      'le.carts.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns a single basket by ID
  async findById(id: string): Promise<CartRow> {
    this.logger.log(`le.carts.findById — id: ${id}`);
    return this.nats.send('commerce', 'le.carts.findById', { id });
  }

  // Returns a basket's lines, priced through this site's channel
  async findItems(id: string, currencyCode: string, legalEntityId?: string): Promise<CartLinesResponse> {
    const catalogId = await this.resolveCatalog(legalEntityId);
    this.logger.log(`le.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'le.carts.findItemsById', { id, currencyCode, catalogId, legalEntityId });
  }

  // Returns paginated, filtered and sorted items of one basket for the data table
  async findItemsForTable(
    cartId: string,
    userId: string,
    currencyCode: string,
    legalEntityId?: string,
  ): Promise<CartItemsTableResponse> {
    this.logger.log(`le.carts.items.table — cart: ${cartId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-cart-${cartId}-items`,
    );
    const catalogId = await this.resolveCatalog(legalEntityId);

    const { result, count } = await this.nats.send<{ result: CartLineRow[]; count: number }>(
      'commerce',
      'le.carts.items.table',
      { cartId, currencyCode, catalogId, ...(state as object) },
    );

    return { result, count, state, activeViewId };
  }

  // Opens a basket for a shopper, or hands back the one they already have here
  async create(input: { partyId: string; legalEntityId?: string }): Promise<CreateResponseDto<CartRow>> {
    this.logger.log(`le.carts.create — party: ${input.partyId}`);
    return this.nats.send('commerce', 'le.carts.create', { partyId: input.partyId });
  }

  // Closes a basket outright — the lines go with it
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.carts.delete — id: ${id}`);
    return this.nats.send('commerce', 'le.carts.delete', { id });
  }

  async addItem(
    cartId: string,
    input: {
      partyId: string;
      offeringVariantId: string;
      quantity: number;
      currencyCode: string;
      legalEntityId?: string;
    },
  ): Promise<CartLinesResponse> {
    const catalogId = await this.resolveCatalog(input.legalEntityId);
    this.logger.log(`le.carts.items.addForCart — cart: ${cartId}, variant: ${input.offeringVariantId}`);
    await this.nats.send('commerce', 'le.carts.items.addForCart', { cartId, catalogId, ...input });
    return this.findItems(cartId, input.currencyCode, input.legalEntityId);
  }

  async updateItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; quantity: number; currencyCode: string; legalEntityId?: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`le.carts.items.updateForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'le.carts.items.updateForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode, input.legalEntityId);
  }

  async removeItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; currencyCode: string; legalEntityId?: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`le.carts.items.removeForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'le.carts.items.removeForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode, input.legalEntityId);
  }

  /**
   * The catalogue this company sells from, or nothing when it has not been given a channel.
   *
   * Never throws — see the site gateway's copy for why a missing price list must not stop a basket.
   */
  private async resolveCatalog(legalEntityId?: string): Promise<string | undefined> {
    const resolution = await this.nats.send<{
      resolved: boolean;
      catalog: { catalogId: string; channelId: string } | null;
    }>('commerce', 'org.catalogChannels.resolve', {
      type: 'APP',
      siteId: null,
      legalEntityId: legalEntityId ?? null,
    });

    return resolution?.catalog?.catalogId;
  }
}
