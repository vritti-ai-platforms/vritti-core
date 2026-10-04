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
 * The pricing context is the **reader's**, not the basket's. A basket records no catalogue, because
 * what a line is worth is a question about who is asking — so each read carries its own workspace's
 * catalogue and prices through that. Both fields are optional: a workspace with no channel assigned
 * still has baskets, and they come back unpriced rather than refused.
 */
export class CartScopeDto {
  @IsUUID('7')
  partyId: string;

  /** ISO 4217. Fixes which of a listing's prices the basket is read at. */
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  /** The catalogue the reader sells from, when they have one. */
  @IsOptional()
  @IsUUID('7')
  appId?: string;

  /** The outlet whose price wins, falling back to the organization-wide row when it has none. */
  @IsOptional()
  @IsUUID('7')
  siteId?: string;
}

export class AddCartItemDto extends CartScopeDto {
  /** The product. Which catalogue offers it is resolved per read, never stored. */
  @IsUUID('7')
  offeringVariantId: string;

  // Bounded here as well as by the CHECK, so an out-of-range quantity is a readable refusal rather
  // than a constraint violation surfacing as a server error.
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class UpdateCartItemDto extends CartScopeDto {
  @IsUUID('7')
  offeringVariantId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class RemoveCartItemDto extends CartScopeDto {
  @IsUUID('7')
  offeringVariantId: string;
}

/** Emptying needs no currency or catalogue: nothing is read back, so there is no price to resolve. */
export class ClearCartDto {
  @IsUUID('7')
  partyId: string;
}
