import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MobileAuthSession {
  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => String, { nullable: true })
  refreshToken?: string;

  @Field(() => Int, { nullable: true })
  expiresIn?: number;

  @Field(() => Boolean, { nullable: true })
  isAuthenticated?: boolean;
}
