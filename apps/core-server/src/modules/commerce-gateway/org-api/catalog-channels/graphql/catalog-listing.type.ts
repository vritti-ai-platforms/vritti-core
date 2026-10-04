import { Field, ID, ObjectType } from '@nestjs/graphql';

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
