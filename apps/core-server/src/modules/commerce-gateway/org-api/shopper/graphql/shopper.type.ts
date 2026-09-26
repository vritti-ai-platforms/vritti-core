import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * Money on the wire — a currency and a major-unit string.
 *
 * A string, never a float: `value` carries exact decimals, and the amounts behind it are summed as
 * integer minor units server-side. A `Float` here would reintroduce the rounding the whole money
 * layer exists to avoid.
 */
@ObjectType()
export class Money {
  @Field(() => String)
  currency: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class CartItem {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  catalogListingId: string;

  /**
   * What a storefront joins its own product page on.
   *
   * The variant, not the listing: a listing belongs to one catalogue and a catalogue is per site,
   * so the listing differs per outlet while the variant does not.
   */
  @Field(() => ID)
  offeringVariantId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => Money, { nullable: true })
  unitPrice?: Money | null;

  @Field(() => Money, { nullable: true })
  lineTotal?: Money | null;

  /**
   * Whether this line can still be bought.
   *
   * False once the listing is delisted, its variant or offering is switched off, or the catalogue
   * stops pricing it in the basket's currency. The line is still returned — a basket that loses
   * things without saying so is worse than one that explains — but it is excluded from `subtotal`
   * and checkout must refuse it.
   */
  @Field(() => Boolean)
  isAvailable: boolean;
}

/**
 * A basket — a view over the lines a shopper holds, not a record of its own.
 *
 * No id and no status: there is no basket row behind this, so neither had anything to address. An
 * empty basket is simply no lines.
 */
@ObjectType()
export class Cart {
  /** The currency the lines were priced in — the one the caller asked for. */
  @Field(() => String)
  currencyCode: string;

  @Field(() => [CartItem])
  items: CartItem[];

  /** Totals only the lines that can actually be bought. */
  @Field(() => Money)
  subtotal: Money;

  /** Quantity across available lines — the number a basket badge shows. */
  @Field(() => Int)
  itemCount: number;
}

@ObjectType()
export class WishlistItem {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  catalogListingId: string;

  /** What a storefront joins its own product page on — see `CartItem` for why the variant. */
  @Field(() => ID)
  offeringVariantId: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => Money, { nullable: true })
  price?: Money | null;

  @Field(() => Boolean)
  isAvailable: boolean;

  @Field(() => String)
  createdAt: string;
}

/**
 * What `addToWishlist` answers with.
 *
 * The list, plus whether it was already there. Saving twice saves the same thing, so the mutation
 * cannot fail on a repeat — but "saved" and "already in your wishlist" are different things to
 * tell somebody, and only the insert knows which happened.
 */
@ObjectType()
export class WishlistAddResult {
  @Field(() => Boolean)
  alreadyExists: boolean;

  @Field(() => [WishlistItem])
  wishlist: WishlistItem[];
}

/**
 * One item a storefront sells.
 *
 * `id` is the catalogue listing — the id a site stores against its own product page, and the one a
 * basket line and a wishlist row both point at.
 */
@ObjectType()
export class CatalogListing {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  offeringVariantId: string;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => Money, { nullable: true })
  price?: Money | null;
}
