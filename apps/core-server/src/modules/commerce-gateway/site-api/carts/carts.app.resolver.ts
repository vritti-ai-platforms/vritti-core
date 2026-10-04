import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, PartyId, SiteId } from '@/security/decorators';
import { AddCartItemInput, CartItemRefInput, CartScopeInput, UpdateCartItemInput } from './graphql/cart.input';
import { Cart, CartQuantity } from './graphql/cart.type';
import { CartsGatewayService } from './services/carts-gateway.service';

/**
 * A party's basket, for the organization's own storefronts.
 *
 * **Nothing here takes a party or a cart id.** The party comes from `@PartyId()`, which reads the
 * party the request was signed for; the basket is whichever one belongs to that party in this
 * app. There is therefore no argument a caller could change to reach somebody else's basket — the
 * only way to act for a different party is to sign for them, which requires their credential.
 *
 * The catalogue is resolved from the credential too, in the gateway service, so a listing from a
 * range this storefront does not sell is refused even with a valid id.
 *
 * Gated like every other app surface: `@RequireFeature` plus a `@RequirePermission` per operation,
 * resolved against the credential's `graphql` bucket. A storefront that may keep baskets is one
 * that was granted exactly that.
 *
 * The codes are **site-scoped**, because a basket is an act at an outlet: it becomes an order that
 * site fulfils and its lines are priced the way that site sells. The same codes serve the staff
 * screens; which surface may claim them is the catalog's per-platform flags, and a plan entitles the
 * two independently.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_CARTS.featureCode)
export class CartsAppResolver {
  private readonly logger = new Logger(CartsAppResolver.name);

  constructor(private readonly service: CartsGatewayService) {}

  /** The party's basket, or an empty one. Never creates a row. */
  @Query(() => Cart, { name: 'cart' })
  @RequirePermission(SITE_CARTS.view)
  cart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: CartScopeInput,
  ): Promise<Cart> {
    this.logger.log('QUERY cart');
    return this.service.findPartyCart(appId, partyId, input.currencyCode, siteId) as Promise<Cart>;
  }

  /**
   * How many of each product the party holds — a product page draws its stepper from this.
   *
   * The cheap read beside `cart`: counts only, no catalogue resolved and nothing priced, so a page
   * can ask on every view without paying for the whole basket.
   */
  @Query(() => [CartQuantity], { name: 'cartQuantities' })
  @RequirePermission(SITE_CARTS.view)
  cartQuantities(@PartyId() partyId: string): Promise<CartQuantity[]> {
    this.logger.log('QUERY cartQuantities');
    return this.service.findShopperQuantities(partyId);
  }

  /** Adds a listing, opening a basket if this is the party's first line. */
  @Mutation(() => Cart, { name: 'addToCart' })
  @RequirePermission(SITE_CARTS.add)
  addToCart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: AddCartItemInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION addToCart');
    return this.service.addShopperItem({ appId, partyId, siteId, ...input }) as Promise<Cart>;
  }

  /** Sets a line to an exact quantity. */
  @Mutation(() => Cart, { name: 'updateCartItem' })
  @RequirePermission(SITE_CARTS.edit)
  updateCartItem(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: UpdateCartItemInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION updateCartItem');
    return this.service.updateShopperItem({ appId, partyId, siteId, ...input }) as Promise<Cart>;
  }

  @Mutation(() => Cart, { name: 'removeFromCart' })
  @RequirePermission(SITE_CARTS.delete)
  removeFromCart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: CartItemRefInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION removeFromCart');
    return this.service.removeShopperItem({ appId, partyId, siteId, ...input }) as Promise<Cart>;
  }

  /** Empties the basket — a delete of every line the party holds in this storefront. */
  @Mutation(() => Cart, { name: 'clearCart' })
  @RequirePermission(SITE_CARTS.delete)
  async clearCart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: CartScopeInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION clearCart');
    await this.service.clearShopperCart(partyId);
    // The emptied basket rather than a bare success flag, so a caller redraws from one response.
    return this.service.findPartyCart(appId, partyId, input.currencyCode, siteId) as Promise<Cart>;
  }
}
