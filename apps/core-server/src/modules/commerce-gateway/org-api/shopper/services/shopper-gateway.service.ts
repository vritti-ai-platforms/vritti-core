import { Injectable, Logger } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';

/** What the commerce side answers with. Structural — the DTO classes live in the microservice. */
export interface ResolvedCatalog {
  catalogId: string;
  catalogName: string;
  taxInclusive: boolean;
  channelId: string;
}

/** One sellable line of a storefront's range, as the site sees it. */
export interface CatalogListingPayload {
  id: string;
  offeringVariantId: string;
  sku: string | null;
  variantName: string | null;
  isActive: boolean;
  prices: { price: { currency: string; value: string } }[];
}

export interface CartItemPayload {
  id: string;
  catalogListingId: string;
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

/** What `addToWishlist` answers with — the list, plus whether the mark was already there. */
export interface WishlistAddPayload {
  alreadyExists: boolean;
  wishlist: WishlistItemPayload[];
}

export interface WishlistItemPayload {
  id: string;
  catalogListingId: string;
  offeringVariantId: string;
  name: string;
  sku: string | null;
  price: { currency: string; value: string } | null;
  isAvailable: boolean;
  createdAt: string;
}

/**
 * Baskets and wishlist for a storefront, acting for one signed-in shopper.
 *
 * **The catalogue is resolved here, from the credential — never taken from the caller.** Every
 * operation that names a listing is checked against the catalogue this app's APP channel points at,
 * so a storefront cannot reach into a catalogue it does not sell, even knowing a listing id. It is
 * the same rule the OTP gateway follows for its WhatsApp config: the credential decides what it is
 * allowed to touch, not an argument.
 *
 * `appId` and `partyId` arrive from `auth`, which the signature covers, so they cannot be
 * re-pointed in transit.
 */
@Injectable()
export class ShopperGatewayService {
  private readonly logger = new Logger(ShopperGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  /**
   * The catalogue this app sells.
   *
   * Refused rather than defaulted when nothing is configured: falling back to some other catalogue
   * would quietly let a storefront sell a range nobody chose for it.
   */
  async resolveCatalog(appId: string, siteId?: string, legalEntityId?: string): Promise<ResolvedCatalog> {
    // The scope is part of the question. Resolution ranks by specificity, so a channel configured
    // for this site wins over the organization-wide one — which is how two outlets sell different
    // ranges through the same storefront.
    const resolution = await this.nats.send<{ resolved: boolean; catalog: ResolvedCatalog | null }>(
      'commerce',
      'org.catalogChannels.resolve',
      { type: 'APP', appId, siteId: siteId ?? null, legalEntityId: legalEntityId ?? null },
    );

    if (!resolution?.catalog) {
      this.logger.warn(`No APP catalog channel for app ${appId}`);
      throw new NotFoundException({
        label: 'Store Not Configured',
        detail: 'This store has no catalogue assigned yet.',
      });
    }
    return resolution.catalog;
  }

  /**
   * Everything this storefront sells.
   *
   * Reached through the credential's own APP channel, so a site can only ever read the range it was
   * given — there is no argument naming a catalogue.
   */
  async listCatalogListings(appId: string, siteId?: string, legalEntityId?: string): Promise<CatalogListingPayload[]> {
    const { catalogId, channelId } = await this.resolveCatalog(appId, siteId, legalEntityId);
    this.logger.log(`org.catalogs.listings.forChannel — channelId: ${channelId}`);
    // The site decides which price row answers — price is per listing x site x currency.
    return this.nats.send('commerce', 'org.catalogs.listings.forChannel', { channelId, catalogId, siteId });
  }

  async getCart(appId: string, partyId: string, currencyCode: string, siteId?: string): Promise<CartPayload> {
    const { catalogId } = await this.resolveCatalog(appId, siteId);
    this.logger.log(`site.carts.get — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.get', { partyId, currencyCode, catalogId, siteId });
  }

  async addCartItem(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    siteId?: string;
  }): Promise<CartPayload> {
    const { appId: _appId, ...cart } = input;
    const { catalogId, channelId } = await this.resolveCatalog(input.appId, input.siteId);
    this.logger.log(`site.carts.items.add — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'site.carts.items.add', { ...cart, catalogId, channelId });
  }

  async updateCartItem(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    quantity: number;
    currencyCode: string;
    siteId?: string;
  }): Promise<CartPayload> {
    const { appId: _appId, ...cart } = input;
    const { catalogId } = await this.resolveCatalog(input.appId, input.siteId);
    this.logger.log(`site.carts.items.update — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'site.carts.items.update', { ...cart, catalogId });
  }

  async removeCartItem(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<CartPayload> {
    const { appId: _appId, ...cart } = input;
    const { catalogId } = await this.resolveCatalog(input.appId, input.siteId);
    this.logger.log(`site.carts.items.remove — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'site.carts.items.remove', { ...cart, catalogId });
  }

  clearCart(partyId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.carts.clear — party: ${partyId}`);
    return this.nats.send('commerce', 'site.carts.clear', { partyId });
  }

  async listWishlist(
    appId: string,
    partyId: string,
    currencyCode: string,
    siteId?: string,
  ): Promise<WishlistItemPayload[]> {
    // A saved row stores the product, so reading it back needs the catalogue that prices it here —
    // the same resolution a basket read does.
    const { catalogId } = await this.resolveCatalog(appId, siteId);
    this.logger.log(`org.wishlist.list — party: ${partyId}`);
    return this.nats.send('commerce', 'org.wishlist.list', { appId, partyId, currencyCode, catalogId, siteId });
  }

  async addToWishlist(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<WishlistAddPayload> {
    const { catalogId } = await this.resolveCatalog(input.appId, input.siteId);
    this.logger.log(`org.wishlist.add — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'org.wishlist.add', { ...input, catalogId });
  }

  async removeFromWishlist(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<WishlistItemPayload[]> {
    const { catalogId } = await this.resolveCatalog(input.appId, input.siteId);
    this.logger.log(`org.wishlist.remove — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'org.wishlist.remove', { ...input, catalogId });
  }
}
