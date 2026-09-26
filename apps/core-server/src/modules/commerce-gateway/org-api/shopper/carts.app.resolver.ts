import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, PartyId, SiteId } from '@/security/decorators';
import { AddCartItemInput, CartItemRefInput, CartScopeInput, UpdateCartItemInput } from './graphql/shopper.input';
import { Cart } from './graphql/shopper.type';
import { ShopperGatewayService } from './services/shopper-gateway.service';

/**
 * A shopper's basket, for the organization's own storefronts.
 *
 * **Nothing here takes a party or a cart id.** The shopper comes from `@PartyId()`, which reads the
 * party the request was signed for; the basket is whichever one belongs to that shopper in this
 * app. There is therefore no argument a caller could change to reach somebody else's basket — the
 * only way to act for a different shopper is to sign for them, which requires their credential.
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

  constructor(private readonly service: ShopperGatewayService) {}

  /** The shopper's basket, or an empty one. Never creates a row. */
  @Query(() => Cart, { name: 'cart' })
  @RequirePermission(SITE_CARTS.view)
  cart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: CartScopeInput,
  ): Promise<Cart> {
    this.logger.log('QUERY cart');
    return this.service.getCart(appId, partyId, input.currencyCode, siteId) as Promise<Cart>;
  }

  /** Adds a listing, opening a basket if this is the shopper's first line. */
  @Mutation(() => Cart, { name: 'addToCart' })
  @RequirePermission(SITE_CARTS.add)
  addToCart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: AddCartItemInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION addToCart');
    return this.service.addCartItem({ appId, partyId, siteId, ...input }) as Promise<Cart>;
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
    return this.service.updateCartItem({ appId, partyId, siteId, ...input }) as Promise<Cart>;
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
    return this.service.removeCartItem({ appId, partyId, siteId, ...input }) as Promise<Cart>;
  }

  /** Empties the basket — a delete of every line the shopper holds in this storefront. */
  @Mutation(() => Cart, { name: 'clearCart' })
  @RequirePermission(SITE_CARTS.delete)
  async clearCart(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: CartScopeInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION clearCart');
    await this.service.clearCart(partyId);
    // The emptied basket rather than a bare success flag, so a caller redraws from one response.
    return this.service.getCart(appId, partyId, input.currencyCode, siteId) as Promise<Cart>;
  }
}
