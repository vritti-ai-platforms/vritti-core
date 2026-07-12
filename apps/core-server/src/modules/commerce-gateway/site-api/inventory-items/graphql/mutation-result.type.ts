import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MutationResult {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}
