import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';

/** One basket as the table and the detail header read it. */
export interface CartRow {
  id: string;
  siteId: string | null;
  legalEntityId: string | null;
  partyId: string | null;
  partyName: string | null;
  channelId: string | null;
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

export interface CartLinesResponse {
  currencyCode: string;
  items: CartLineRow[];
  subtotal: { currency: string; value: string };
  itemCount: number;
}

/**
 * Baskets across the company, for the people who invoice them.
 *
 * Reading downward through the workspace tree is what puts a basket filled at one of the company's
 * tills on this list. Lines are priced through the channel the basket was opened at, so an invoice
 * raised here charges what the outlet was selling at — not what the company would have.
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
    const { catalogId } = await this.resolveChannel(legalEntityId);
    this.logger.log(`le.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'le.carts.findItemsById', { id, currencyCode, catalogId, legalEntityId });
  }

  // Opens a basket for a shopper, or hands back the one they already have here
  async create(input: { partyId: string; legalEntityId?: string }): Promise<CreateResponseDto<CartRow>> {
    const { channelId } = await this.resolveChannel(input.legalEntityId);
    this.logger.log(`le.carts.create — party: ${input.partyId}`);
    return this.nats.send('commerce', 'le.carts.create', { partyId: input.partyId, channelId });
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
    const { catalogId } = await this.resolveChannel(input.legalEntityId);
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
   * The APP channel this company sells through, and the catalogue behind it.
   *
   * Refused rather than defaulted: a company with no channel has no range, and pricing a basket against
   * some other company's catalogue would be worse than saying so.
   */
  private async resolveChannel(legalEntityId?: string): Promise<{ catalogId: string; channelId: string }> {
    const resolution = await this.nats.send<{
      resolved: boolean;
      catalog: { catalogId: string; channelId: string } | null;
    }>('commerce', 'org.catalogChannels.resolve', { type: 'APP', siteId: null, legalEntityId: legalEntityId ?? null });

    if (!resolution?.catalog) {
      throw new NotFoundException({
        label: 'No Catalogue Here',
        detail: 'This company has no app channel assigned, so nothing can be priced for it yet.',
      });
    }
    return resolution.catalog;
  }
}
