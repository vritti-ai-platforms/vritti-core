import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * A legal entity a storefront may sell as.
 *
 * `currencyCode` is the reason this is exposed at all: it is the only place a selling currency is
 * stated, so a storefront resolves one from here rather than configuring its own and risking a value
 * that disagrees with the entity it claims to describe.
 */
@ObjectType()
export class AppLegalEntity {
  @Field(() => String)
  id: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => String, {
    description:
      'ISO 4217. The currency a session in this entity prices in — the only place it is stated, so a ' +
      'storefront never configures one of its own.',
  })
  currencyCode: string;

  @Field(() => String, { description: 'ISO 3166-1 alpha-2' })
  country: string;

  @Field(() => Int)
  sortOrder: number;
}
