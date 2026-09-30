import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Money } from '../../../org-api/catalogs/graphql/catalog-listing.type';

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
