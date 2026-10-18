import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Money {
  @Field(() => String)
  currency: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class VariantFacetValue {
  @Field(() => String)
  code: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class VariantFacet {
  @Field(() => String)
  code: string;

  @Field(() => String)
  label: string;

  @Field(() => [VariantFacetValue])
  values: VariantFacetValue[];
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

  @Field(() => [VariantFacet])
  dimensions: VariantFacet[];

  @Field(() => [VariantFacet])
  attributes: VariantFacet[];

  @Field(() => Money)
  price: Money;
}
