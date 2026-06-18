import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MobileTokens {
  @Field(() => String)
  accessToken: string;

  @Field(() => String)
  refreshToken: string;

  @Field(() => Int)
  expiresIn: number;
}
