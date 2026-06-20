import { Field, ObjectType } from '@nestjs/graphql';

// Generic success/message result for mutations that don't return an entity (e.g. delete).
// Shape matches api-sdk's SuccessResponseDto so gateway results forward without mapping.
@ObjectType()
export class MutationResult {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}
