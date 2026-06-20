import { Field, ID, ObjectType } from '@nestjs/graphql';

// Mirrors the InventoryItemResponseDto fields the mobile feed consumes (the client `InventoryItem`).
// The gateway response carries extra fields (hasMrp, defaultMrp, …) that are simply not declared
// here, so GraphQL omits them. Date fields are String (ISO 8601): GraphQLISODateTime.serialize only
// accepts Date objects, and the response carries ISO strings.
@ObjectType()
export class InventoryItem {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  type: string;

  @Field(() => String)
  tracking: string;

  @Field(() => String)
  pickStrategy: string;

  @Field(() => String)
  categoryId: string;

  @Field(() => String, { nullable: true })
  categoryName: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  uomId: string;

  @Field(() => String, { nullable: true })
  uomSymbol: string | null;

  @Field(() => String, { nullable: true })
  purchaseTaxGroupId: string | null;

  @Field(() => String, { nullable: true })
  hsnCode: string | null;

  @Field(() => Boolean)
  canDelete: boolean;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}
