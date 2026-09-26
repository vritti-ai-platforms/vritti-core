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
 * Baskets at this outlet, for the people who work there.
 *
 * Every line is priced through the site's own APP channel rather than a catalogue named by the
 * caller — which is the same resolution the storefront gets, so a basket reads the same whether it
 * is opened at the till or on the website.
 */
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
    const { catalogId } = await this.resolveChannel(siteId);
    this.logger.log(`site.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.findItemsById', { id, currencyCode, catalogId, siteId });
  }

  // Opens a basket for a shopper, or hands back the one they already have here
  async create(input: { partyId: string; siteId?: string }): Promise<CreateResponseDto<CartRow>> {
    const { channelId } = await this.resolveChannel(input.siteId);
    this.logger.log(`site.carts.create — party: ${input.partyId}`);
    return this.nats.send('commerce', 'site.carts.create', { partyId: input.partyId, channelId });
  }

  // Closes a basket outright — the lines go with it
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.delete — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.delete', { id });
  }

  async addItem(
    cartId: string,
    input: { partyId: string; offeringVariantId: string; quantity: number; currencyCode: string; siteId?: string },
  ): Promise<CartLinesResponse> {
    const { catalogId } = await this.resolveChannel(input.siteId);
    this.logger.log(`site.carts.items.addForCart — cart: ${cartId}, variant: ${input.offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.addForCart', { cartId, catalogId, ...input });
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

  /**
   * The APP channel this outlet sells through, and the catalogue behind it.
   *
   * Refused rather than defaulted: a site with no channel has no range, and pricing a basket against
   * some other outlet's catalogue would be worse than saying so.
   */
  private async resolveChannel(siteId?: string): Promise<{ catalogId: string; channelId: string }> {
    const resolution = await this.nats.send<{
      resolved: boolean;
      catalog: { catalogId: string; channelId: string } | null;
    }>('commerce', 'org.catalogChannels.resolve', { type: 'APP', siteId: siteId ?? null, legalEntityId: null });

    if (!resolution?.catalog) {
      throw new NotFoundException({
        label: 'No Catalogue Here',
        detail: 'This outlet has no app channel assigned, so nothing can be priced for it yet.',
      });
    }
    return resolution.catalog;
  }
}
