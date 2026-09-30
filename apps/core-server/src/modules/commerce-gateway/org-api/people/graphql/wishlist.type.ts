import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Money } from '../../catalogs/graphql/catalog-listing.type';

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
