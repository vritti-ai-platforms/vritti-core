import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, PartyId, SiteId } from '@/security/decorators';
import { WishlistQueryInput, WishlistRefInput } from './graphql/shopper.input';
import { WishlistAddResult, WishlistItem } from './graphql/shopper.type';
import { ShopperGatewayService } from './services/shopper-gateway.service';

/**
 * The things a shopper marked to come back to.
 *
 * Scoped exactly as the basket is — the party comes from the signature, the catalogue from the
 * credential — so the same argument holds: there is no id a caller could change to read somebody
 * else's list.
 *
 * Both mutations answer with the whole list rather than the row they touched, because the caller is
 * redrawing a row of hearts and a single row would leave it guessing at the rest.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_PEOPLE.featureCode)
export class WishlistAppResolver {
  private readonly logger = new Logger(WishlistAppResolver.name);

  constructor(private readonly service: ShopperGatewayService) {}

  @Query(() => [WishlistItem], { name: 'wishlist' })
  @RequirePermission(ORG_PEOPLE.wishlist.view)
  wishlist(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: WishlistQueryInput,
  ): Promise<WishlistItem[]> {
    this.logger.log('QUERY wishlist');
    return this.service.listWishlist(appId, partyId, input.currencyCode, siteId) as Promise<WishlistItem[]>;
  }

  /** Saving something already saved is the same row, not an error. */
  @Mutation(() => WishlistAddResult, { name: 'addToWishlist' })
  @RequirePermission(ORG_PEOPLE.wishlist.add)
  addToWishlist(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: WishlistRefInput,
  ): Promise<WishlistAddResult> {
    this.logger.log('MUTATION addToWishlist');
    return this.service.addToWishlist({ appId, partyId, siteId, ...input }) as Promise<WishlistAddResult>;
  }

  /** Unmarking something that was never marked leaves the list in the state asked for. */
  @Mutation(() => [WishlistItem], { name: 'removeFromWishlist' })
  @RequirePermission(ORG_PEOPLE.wishlist.delete)
  removeFromWishlist(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: WishlistRefInput,
  ): Promise<WishlistItem[]> {
    this.logger.log('MUTATION removeFromWishlist');
    return this.service.removeFromWishlist({ appId, partyId, siteId, ...input }) as Promise<WishlistItem[]>;
  }
}
