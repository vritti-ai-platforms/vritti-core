import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

/**
 * What every basket operation carries.
 *
 * The party is **not** the caller's to choose — the gateway takes it off the signed request and puts
 * it here. It travels in the payload because NATS has no notion of a principal, but a storefront
 * never supplies it, so nothing a shopper can send reaches another basket.
 *
 * There is no app, and no workspace either. A basket belongs to a party at a workspace, and the
 * workspace rides the request as the RLS context rather than as a field — which is what stops a
 * caller naming an outlet whose baskets are not theirs to touch.
 *
 * `catalogId` and `siteId` are not scope: they are how a line gets priced. The gateway resolves both
 * from the caller's APP channel, so what a basket costs is answered by the outlet it is read from.
 */
export class CartScopeDto {
  @IsUUID()
  partyId: string;

  /** ISO 4217. Fixes which of a listing's prices the basket is read at. */
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  /** The catalogue the caller's channel serves — the line stores a product, not one catalogue's offer of it. */
  @IsUUID()
  catalogId: string;

  /** The outlet whose price wins, falling back to the organization-wide row when it has none. */
  @IsOptional()
  @IsUUID()
  siteId?: string;
}

export class AddCartItemDto extends CartScopeDto {
  /** The product. Which catalogue offers it is resolved per read, never stored. */
  @IsUUID()
  offeringVariantId: string;

  /** Recorded on the basket when it is opened, so a staff view can price it through the same door. */
  @IsOptional()
  @IsUUID()
  channelId?: string;

  // Bounded here as well as by the CHECK, so an out-of-range quantity is a readable refusal rather
  // than a constraint violation surfacing as a server error.
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdateCartItemDto extends CartScopeDto {
  @IsUUID()
  offeringVariantId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class RemoveCartItemDto extends CartScopeDto {
  @IsUUID()
  offeringVariantId: string;
}

/** Emptying needs no currency or catalogue: nothing is read back, so there is no price to resolve. */
export class ClearCartDto {
  @IsUUID()
  partyId: string;
}
