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
  // The dimension or attribute code, e.g. pack-size
  @Field(() => String)
  code: string;

  @Field(() => String)
  label: string;

  // One value for a dimension, one or more for an attribute
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

  // The offering's name. A variant has none of its own, so this is the title and the facets below are what
  // tell one variant from another — render them under it rather than expecting a single line.
  @Field(() => String)
  name: string;

  @Field(() => [VariantFacet])
  dimensions: VariantFacet[];

  @Field(() => [VariantFacet])
  attributes: VariantFacet[];

  @Field(() => Money)
  price: Money;
}
