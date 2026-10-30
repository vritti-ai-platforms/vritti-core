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

// The party's cart at one store, with the gateways that store can take a payment through
@ObjectType()
export class CartSite {
  @Field(() => ID)
  siteId: string;

  @Field(() => String)
  siteName: string;

  @Field(() => [CartItem])
  items: CartItem[];

  // Totals only the lines that can actually be bought
  @Field(() => Money)
  subtotal: Money;

  @Field(() => Int)
  itemCount: number;

  // Gateway codes with a payout switched on for this store, e.g. razorpay
  @Field(() => [String], { description: 'Gateway codes this store accepts, e.g. razorpay.' })
  gateways: string[];
}

// How the whole cart can be paid in one payment
@ObjectType()
export class CartCheckout {
  // Gateway codes every store with items accepts through the same gateway account; empty means the cart cannot
  // be paid in one payment yet
  @Field(() => [String], {
    description: 'Gateway codes that pay for every store in one payment. Empty when the stores share none.',
  })
  gateways: string[];
}

@ObjectType()
export class Cart {
  // The currency the lines were priced in — the one the caller asked for
  @Field(() => String)
  currencyCode: string;

  // One entry per store the party holds lines at; a store with no lines is left out
  @Field(() => [CartSite])
  sites: CartSite[];

  // Totals only the lines that can actually be bought, across every store
  @Field(() => Money)
  subtotal: Money;

  // Quantity across available lines — the number a cart badge shows
  @Field(() => Int)
  itemCount: number;

  @Field(() => CartCheckout)
  checkout: CartCheckout;
}

@ObjectType()
export class CartQuantity {
  // What a storefront joins its own product page on
  @Field(() => String)
  code: string;

  @Field(() => Int)
  quantity: number;
}
