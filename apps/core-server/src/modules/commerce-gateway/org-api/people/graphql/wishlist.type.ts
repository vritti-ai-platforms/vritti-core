import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Money } from '../../catalog-channels/graphql/catalog-listing.type';

@ObjectType()
export class WishlistItem {
  @Field(() => ID)
  id: string;

  // The priced row this line points at, or null once the catalogue stops carrying it
  @Field(() => ID, { nullable: true })
  catalogListingId: string | null;

  // What a storefront joins its own product page on — see `CartItem` for why the variant
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

@ObjectType()
export class WishlistAddResult {
  @Field(() => Boolean)
  alreadyExists: boolean;

  @Field(() => [WishlistItem])
  wishlist: WishlistItem[];
}
