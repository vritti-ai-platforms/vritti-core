import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

/** One basket as the table and the detail header read it. */
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
  async findItems(id: string, currencyCode: string): Promise<CartLinesResponse> {
    this.logger.log(`le.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'le.carts.findItemsById', { id, currencyCode, appId: null });
  }

  // Returns paginated, filtered and sorted items of one basket for the data table
  async findItemsForTable(cartId: string, userId: string, currencyCode: string): Promise<CartItemsTableResponse> {
    this.logger.log(`le.carts.items.table — cart: ${cartId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-cart-${cartId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: CartLineRow[]; count: number }>(
      'commerce',
      'le.carts.items.table',
      { cartId, currencyCode, appId: null, ...(state as object) },
    );

    return { result, count, state, activeViewId };
  }

  // Opens a basket for a party, or hands back the one they already have here
  async create(input: { partyId: string }): Promise<CreateResponseDto<CartRow>> {
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
    },
  ): Promise<CartLinesResponse> {
    this.logger.log(`le.carts.items.addForCart — cart: ${cartId}, variant: ${input.offeringVariantId}`);
    await this.nats.send('commerce', 'le.carts.items.addForCart', { cartId, appId: null, ...input });
    return this.findItems(cartId, input.currencyCode);
  }

  async updateItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; quantity: number; currencyCode: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`le.carts.items.updateForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'le.carts.items.updateForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode);
  }

  async removeItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; currencyCode: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`le.carts.items.removeForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'le.carts.items.removeForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode);
  }
}
