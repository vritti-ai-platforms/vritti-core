import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OfferingVariantOption {
  @Field(() => ID)
  id: string;

  // The code is the whole option: it identifies the variant and its own words read back as the label
  @Field(() => String)
  code: string;
}

@ObjectType()
export class OfferingVariantOptions {
  @Field(() => [OfferingVariantOption])
  items: OfferingVariantOption[];

  @Field(() => Int, { description: 'Matching variants across every page, after excludeIds' })
  total: number;
}
