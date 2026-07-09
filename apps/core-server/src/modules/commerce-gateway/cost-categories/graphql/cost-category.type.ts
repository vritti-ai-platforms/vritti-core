import { Field, ID, ObjectType } from '@nestjs/graphql';

// Mirrors CostCategoryResponseDto — the Cost Category cards the mobile screen lists. A category has a
// unique `code`, a `name`, a fixed `kind` (ITEM/FREIGHT/…), an active flag, an isSystem flag (system rows
// can be deactivated but not deleted), and a canDelete flag (false when isSystem or referenced by cost rows).
@ObjectType()
export class CostCategory {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  kind: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Boolean)
  isSystem: boolean;

  @Field(() => Boolean)
  canDelete: boolean;
}
