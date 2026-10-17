import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Money } from '../../../org-api/catalog-channels/graphql/catalog-listing.type';

@ObjectType()
export class CartItem {
  @Field(() => ID)
  id: string;

  // The priced row this line points at, or null once the catalogue stops carrying it
  @Field(() => ID, { nullable: true })
  catalogListingId: string | null;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  code: string;

  @Field(() => Money, { nullable: true })
  unitPrice?: Money | null;

  @Field(() => Money, { nullable: true })
  lineTotal?: Money | null;

  // Whether this line can still be bought
  @Field(() => Boolean)
  isAvailable: boolean;
}

@ObjectType()
export class Cart {
  // The currency the lines were priced in — the one the caller asked for
  @Field(() => String)
  currencyCode: string;

  @Field(() => [CartItem])
  items: CartItem[];

  // Totals only the lines that can actually be bought
  @Field(() => Money)
  subtotal: Money;

  // Quantity across available lines — the number a basket badge shows
  @Field(() => Int)
  itemCount: number;
}

@ObjectType()
export class CartQuantity {
  // What a storefront joins its own product page on
  @Field(() => String)
  code: string;

  @Field(() => Int)
  quantity: number;
}
