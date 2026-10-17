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

  // What a site keys its own product record on — the variant's code, stable across sites
  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => Money)
  price: Money;
}
