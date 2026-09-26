import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

/**
 * What every wishlist operation carries.
 *
 * As with baskets, `appId` and `partyId` come off the signed request at the gateway and are never
 * supplied by a storefront — they ride in the payload only because NATS carries no such context.
 *
 * `catalogId` and `siteId` are not scope: they are how a saved row gets priced on the way back. The
 * gateway resolves both from the caller's APP channel.
 */
export class WishlistScopeDto {
  @IsUUID()
  appId: string;

  @IsUUID()
  partyId: string;

  /** ISO 4217, so each row can be priced as it is listed back. */
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  /** The catalogue the caller's storefront sells, so another's product is refused. */
  @IsUUID()
  catalogId: string;

  /** The outlet whose price wins, falling back to the organization-wide row when it has none. */
  @IsOptional()
  @IsUUID()
  siteId?: string;
}

export class AddWishlistItemDto extends WishlistScopeDto {
  /** The product. Which catalogue offers it is resolved per read, never stored. */
  @IsUUID()
  offeringVariantId: string;
}

export class RemoveWishlistItemDto extends WishlistScopeDto {
  @IsUUID()
  offeringVariantId: string;
}
