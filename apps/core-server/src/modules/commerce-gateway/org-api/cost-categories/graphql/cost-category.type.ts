import { Field, ID, ObjectType } from '@nestjs/graphql';

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
