import {
  type PayableGateway,
  PayoutChannelDomainService,
} from '@domain/payout-channel/services/payout-channel.service';
import { type AppSiteRow, SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
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
  code: string;
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
  code: string;
  unitPrice: { currency: string; value: string } | null;
  lineTotal: { currency: string; value: string } | null;
  isAvailable: boolean;
}

// The party's cart at one store, with the gateways that store takes payments through
export interface CartSitePayload {
  siteId: string;
  siteName: string;
  items: CartItemPayload[];
  subtotal: { currency: string; value: string };
  itemCount: number;
  gateways: string[];
}

// The party's cart across the organization's stores, and the gateways that pay for all of it in one payment
export interface CartPayload {
  currencyCode: string;
  sites: CartSitePayload[];
  subtotal: { currency: string; value: string };
  itemCount: number;
  checkout: { gateways: string[] };
}

// What commerce reports for one store: the lines priced through the app's channel there
interface SiteCartResponse {
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
    private readonly siteRepository: SiteDomainRepository,
    private readonly payoutChannelService: PayoutChannelDomainService,
  ) {}

  // Returns paginated, filtered, and sorted carts for the data table
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

  // Returns a single cart by ID
  async findById(id: string): Promise<CartRow> {
    this.logger.log(`site.carts.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.findById', { id });
  }

  // Returns a cart's lines, priced through this site's channel
  async findItems(id: string, currencyCode: string): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.findItemsById — id: ${id}`);
    return this.nats.send('commerce', 'site.carts.findItemsById', { id, currencyCode, appId: null });
  }

  // Returns paginated, filtered and sorted items of one cart for the data table
  async findItemsForTable(cartId: string, userId: string, currencyCode: string): Promise<CartItemsTableResponse> {
    this.logger.log(`site.carts.items.table — cart: ${cartId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-site-cart-${cartId}-items`,
    );

    const { result, count } = await this.nats.send<{ result: CartLineRow[]; count: number }>(
      'commerce',
      'site.carts.items.table',
      { cartId, currencyCode, appId: null, ...(state as object) },
    );

    return { result, count, state, activeViewId };
  }

  // Opens a cart for a party, or hands back the one they already have here
  async create(input: { partyId: string }): Promise<CreateResponseDto<CartRow>> {
    this.logger.log(`site.carts.create — party: ${input.partyId}`);
    return this.nats.send('commerce', 'site.carts.create', { partyId: input.partyId });
  }

  // Closes a cart outright — the lines go with it
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
    },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.addForCart — cart: ${cartId}, variant: ${input.offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.addForCart', { cartId, appId: null, ...input });
    return this.findItems(cartId, input.currencyCode);
  }

  async updateItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; quantity: number; currencyCode: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.updateForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.updateForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode);
  }

  async removeItem(
    cartId: string,
    offeringVariantId: string,
    input: { partyId: string; currencyCode: string },
  ): Promise<CartLinesResponse> {
    this.logger.log(`site.carts.items.removeForCart — cart: ${cartId}, variant: ${offeringVariantId}`);
    await this.nats.send('commerce', 'site.carts.items.removeForCart', { cartId, offeringVariantId, ...input });
    return this.findItems(cartId, input.currencyCode);
  }

  // ── The party's own cart, for a storefront acting for one signed-in party ── The catalogue comes from the calling
  // credential's APP channel, never from the caller, so a storefront cannot reach a catalogue it does not carry even
  // knowing a listing id.

  // The party's cart at every store the organization sells from, each read under its own store since a cart and its
  // prices belong to one store, with the gateways able to take one payment for all of them
  async findPartyCart(orgId: string, appId: string, partyId: string, currencyCode: string): Promise<CartPayload> {
    const sites = await this.siteRepository.findForAppByOrg(orgId);
    this.logger.log(`site.carts.findAtSites — party: ${partyId}, sites: ${sites.length}`);
    const carts = await this.nats.send<{ siteId: string; cart: SiteCartResponse }[]>(
      'commerce',
      'site.carts.findAtSites',
      {
        partyId,
        currencyCode,
        appId,
        sites: sites.map((site) => ({ siteId: site.id, legalEntityId: site.legalEntityId, timezone: site.timezone })),
      },
    );

    const siteById = new Map(sites.map((site) => [site.id, site]));
    const cartSites: CartSitePayload[] = [];
    const payable: PayableGateway[][] = [];
    for (const { siteId, cart } of carts) {
      const site = siteById.get(siteId);
      if (!site) continue;
      const gateways = await this.payoutChannelService.findPayableGateways({
        legalEntityId: site.legalEntityId,
        siteId,
        appId,
        channel: 'APP',
      });
      payable.push(gateways);
      cartSites.push(toCartSite(site, cart, gateways));
    }

    return {
      currencyCode,
      sites: cartSites,
      subtotal: sumSubtotals(cartSites, currencyCode),
      itemCount: cartSites.reduce((count, site) => count + site.itemCount, 0),
      checkout: { gateways: commonGateways(payable) },
    };
  }

  // Each edit is made at the store in context, then the whole cart is read back so the storefront redraws from one shape

  async addShopperItem(input: {
    orgId: string;
    appId: string;
    partyId: string;
    code: string;
    quantity: number;
    currencyCode: string;
  }): Promise<CartPayload> {
    const { orgId, appId, ...cart } = input;
    this.logger.log(`site.carts.items.add — party: ${input.partyId}, code: ${input.code}`);
    await this.nats.send('commerce', 'site.carts.items.add', { ...cart, appId });
    return this.findPartyCart(orgId, appId, input.partyId, input.currencyCode);
  }

  async updateShopperItem(input: {
    orgId: string;
    appId: string;
    partyId: string;
    code: string;
    quantity: number;
    currencyCode: string;
  }): Promise<CartPayload> {
    const { orgId, appId, ...cart } = input;
    this.logger.log(`site.carts.items.update — party: ${input.partyId}, code: ${input.code}`);
    await this.nats.send('commerce', 'site.carts.items.update', { ...cart, appId });
    return this.findPartyCart(orgId, appId, input.partyId, input.currencyCode);
  }

  async removeShopperItem(input: {
    orgId: string;
    appId: string;
    partyId: string;
    code: string;
    currencyCode: string;
  }): Promise<CartPayload> {
    const { orgId, appId, ...cart } = input;
    this.logger.log(`site.carts.items.remove — party: ${input.partyId}, code: ${input.code}`);
    await this.nats.send('commerce', 'site.carts.items.remove', { ...cart, appId });
    return this.findPartyCart(orgId, appId, input.partyId, input.currencyCode);
  }

  // How many of each product the party holds in their cart here — a count, no catalogue, no price
  findShopperQuantities(partyId: string): Promise<{ code: string; quantity: number }[]> {
    this.logger.log(`site.carts.quantities — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.quantities', { partyId });
  }

  clearShopperCart(partyId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.clear — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.clear', { partyId });
  }
}

function toCartSite(site: AppSiteRow, cart: SiteCartResponse, gateways: PayableGateway[]): CartSitePayload {
  return {
    siteId: site.id,
    siteName: site.name,
    items: cart.items,
    subtotal: cart.subtotal,
    itemCount: cart.itemCount,
    gateways: gateways.map((gateway) => gateway.gatewayCode),
  };
}

// Adds the stores' subtotals in minor units, so no decimal drift
function sumSubtotals(sites: CartSitePayload[], currencyCode: string): { currency: string; value: string } {
  const currency = currencyCode as CurrencyCode;
  const total = sites.reduce((sum, site) => sum + majorToMinor(site.subtotal.value, currency), 0n);
  return { currency: currencyCode, value: minorToMajor(total, currency) };
}

// The gateway codes every store accepts through the same gateway account — the ones a single payment can be split
// from. A store accepts each code at most once, so no code repeats
function commonGateways(sites: PayableGateway[][]): string[] {
  const [first, ...rest] = sites;
  if (!first) return [];
  return first
    .filter((gateway) =>
      rest.every((site) =>
        site.some(
          (other) =>
            other.gatewayCode === gateway.gatewayCode &&
            other.paymentGatewayConfigId === gateway.paymentGatewayConfigId,
        ),
      ),
    )
    .map((gateway) => gateway.gatewayCode);
}
