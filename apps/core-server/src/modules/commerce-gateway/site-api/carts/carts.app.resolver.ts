import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_CARTS } from '@vritti/commerce-permissions/carts';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, OrgId, PartyId } from '@/security/decorators';
import { AddCartItemInput, CartItemRefInput, CartScopeInput, UpdateCartItemInput } from './graphql/cart.input';
import { Cart, CartQuantity } from './graphql/cart.type';
import { CartsGatewayService } from './services/carts-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_CARTS.featureCode)
export class CartsAppResolver {
  private readonly logger = new Logger(CartsAppResolver.name);

  constructor(private readonly service: CartsGatewayService) {}

  // The party's cart across the organization's stores, or an empty one. Never creates a row
  @Query(() => Cart, { name: 'cart' })
  @RequirePermission(SITE_CARTS.view)
  cart(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @Args('input') input: CartScopeInput,
  ): Promise<Cart> {
    this.logger.log('QUERY cart');
    return this.service.findPartyCart(orgId, appId, partyId, input.currencyCode) as Promise<Cart>;
  }

  // How many of each product the party holds — a product page draws its stepper from this
  @Query(() => [CartQuantity], { name: 'cartQuantities' })
  @RequirePermission(SITE_CARTS.view)
  cartQuantities(@PartyId() partyId: string): Promise<CartQuantity[]> {
    this.logger.log('QUERY cartQuantities');
    return this.service.findShopperQuantities(partyId);
  }

  // Adds a listing at the store in context, opening a cart there if this is the party's first line
  @Mutation(() => Cart, { name: 'addToCart' })
  @RequirePermission(SITE_CARTS.add)
  addToCart(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @Args('input') input: AddCartItemInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION addToCart');
    return this.service.addShopperItem({ orgId, appId, partyId, ...input }) as Promise<Cart>;
  }

  // Sets a line to an exact quantity
  @Mutation(() => Cart, { name: 'updateCartItem' })
  @RequirePermission(SITE_CARTS.edit)
  updateCartItem(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @Args('input') input: UpdateCartItemInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION updateCartItem');
    return this.service.updateShopperItem({ orgId, appId, partyId, ...input }) as Promise<Cart>;
  }

  @Mutation(() => Cart, { name: 'removeFromCart' })
  @RequirePermission(SITE_CARTS.delete)
  removeFromCart(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @Args('input') input: CartItemRefInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION removeFromCart');
    return this.service.removeShopperItem({ orgId, appId, partyId, ...input }) as Promise<Cart>;
  }

  // Empties the cart at the store in context — a delete of every line the party holds there
  @Mutation(() => Cart, { name: 'clearCart' })
  @RequirePermission(SITE_CARTS.delete)
  async clearCart(
    @OrgId() orgId: string,
    @AppId() appId: string,
    @PartyId() partyId: string,
    @Args('input') input: CartScopeInput,
  ): Promise<Cart> {
    this.logger.log('MUTATION clearCart');
    await this.service.clearShopperCart(partyId);
    // The remaining cart rather than a bare success flag, so a caller redraws from one response.
    return this.service.findPartyCart(orgId, appId, partyId, input.currencyCode) as Promise<Cart>;
  }
}
