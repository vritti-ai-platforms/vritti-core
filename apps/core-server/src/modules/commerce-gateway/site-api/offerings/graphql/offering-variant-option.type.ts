import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OfferingVariantOption {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  sku: string;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class OfferingVariantOptions {
  @Field(() => [OfferingVariantOption])
  items: OfferingVariantOption[];

  @Field(() => Int, { description: 'Matching variants across every page, after excludeIds' })
  total: number;
}
