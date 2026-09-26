import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsUUID, Length, Max, Min } from 'class-validator';

/**
 * The currency a basket is read and totalled in.
 *
 * Supplied by the storefront rather than guessed here: which currency a shop sells in is its own
 * decision, and a catalogue may legitimately price the same listing in several. Core still refuses
 * anything outside the caller's own catalogue, so naming a currency widens nothing.
 *
 * Note there is deliberately **no party field on any input below.** The shopper comes from the
 * request signature via `@PartyId()`. An input that accepted one would let a storefront read any
 * shopper's basket with a perfectly valid signature.
 */
@InputType()
export class CartScopeInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;
}

@InputType()
export class AddCartItemInput extends CartScopeInput {
  /** The product, not the listing — the catalogue offer of it is resolved server-side, per site. */
  @Field(() => ID)
  @IsUUID()
  offeringVariantId: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

@InputType()
export class UpdateCartItemInput extends CartScopeInput {
  /** The product, not the listing — the catalogue offer of it is resolved server-side, per site. */
  @Field(() => ID)
  @IsUUID()
  offeringVariantId: string;

  /** An exact quantity, not a delta. Removing is its own mutation. */
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

@InputType()
export class CartItemRefInput extends CartScopeInput {
  /** The product, not the listing — the catalogue offer of it is resolved server-side, per site. */
  @Field(() => ID)
  @IsUUID()
  offeringVariantId: string;
}

@InputType()
export class WishlistRefInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  /** The product, not the listing — the catalogue offer of it is resolved server-side, per site. */
  @Field(() => ID)
  @IsUUID()
  offeringVariantId: string;
}

@InputType()
export class WishlistQueryInput {
  @Field(() => String)
  @IsString()
  @Length(3, 3)
  currencyCode: string;
}
