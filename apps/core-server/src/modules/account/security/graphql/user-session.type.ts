import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserSession {
  @Field(() => ID)
  sessionId: string;

  @Field(() => String)
  device: string;

  @Field(() => String, { nullable: true })
  ipAddress?: string | null;

  @Field(() => String)
  lastActive: string;

  @Field(() => Boolean)
  isCurrent: boolean;
}
