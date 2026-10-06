import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Money {
  @Field(() => String)
  currency: string;

  @Field(() => String)
  value: string;
}

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
