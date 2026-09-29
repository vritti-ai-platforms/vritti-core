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
  async findItems(
    id: string,
    currencyCode: string,
    siteId?: string,
    legalEntityId?: string,
  ): Promise<CartLinesResponse> {
    const catalogId = await this.resolveCatalog(siteId, legalEntityId);
    this.logger.log(`site.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.findItemsById', { id, currencyCode, catalogId, siteId });
  }

  // Returns paginated, filtered and sorted items of one basket for the data table
  async findItemsForTable(
    cartId: string,
    userId: string,
    currencyCode: string,
    siteId?: string,
    legalEntityId?: string,
  ): Promise<CartItemsTableResponse> {
    this.logger.log(`site.carts.items.table — cart: ${cartId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-cart-${cartId}-items`,
    );
    const catalogId = await this.resolveCatalog(siteId, legalEntityId);

    const { result, count } = await this.nats.send<{ result: CartLineRow[]; count: number }>(
      'commerce',
      'site.carts.items.table',
      { cartId, currencyCode, catalogId, siteId, ...(state as object) },
    );

    return { result, count, state, activeViewId };
  }

  // Opens a basket for a shopper, or hands back the one they already have here
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
      legalEntityId?: string;
    },
  ): Promise<CartLinesResponse> {
    const catalogId = await this.resolveCatalog(input.siteId, input.legalEntityId);
    this.logger.log(`site.carts.items.addForCart — cart: ${cartId}, variant: ${input.offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.addForCart', { cartId, catalogId, ...input });
    return this.findItems(cartId, input.currencyCode, input.siteId, input.legalEntityId);
  }

  async updateItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; quantity: number; currencyCode: string; siteId?: string; legalEntityId?: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.updateForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.updateForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode, input.siteId, input.legalEntityId);
  }

  async removeItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; currencyCode: string; siteId?: string; legalEntityId?: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.removeForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.removeForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode, input.siteId, input.legalEntityId);
  }

  /**
   * The catalogue this outlet sells from, or nothing when it has not been given a channel.
   *
   * Never throws. A basket is a list of things someone wants; whether the shop can put a price on
   * them is a separate question, and answering it "no" must not stop the basket being opened, read
   * or added to. The lines come back unpriced and flagged unavailable instead.
   *
   * Both halves of the caller's position go down, because `null` is a filter and not a wildcard:
   * resolution matches a scope column with `column IS NULL OR column = :value`, so a column it is
   * told nothing about can only match rows where that column is NULL. Sending `legalEntityId: null`
   * would narrow the search to org-owned channels and hide the site's own — which carries an LE id
   * like every scoped row. The widening is the resolver's to do, not the caller's.
   */
  private async resolveCatalog(siteId?: string, legalEntityId?: string): Promise<string | undefined> {
    const resolution = await this.nats.send<{
      resolved: boolean;
      catalog: { catalogId: string; channelId: string } | null;
    }>('commerce', 'org.catalogChannels.resolve', {
      type: 'APP',
      siteId: siteId ?? null,
      legalEntityId: legalEntityId ?? null,
    });

    return resolution?.catalog?.catalogId;
  }
}
