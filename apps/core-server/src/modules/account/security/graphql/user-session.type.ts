import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserSession {
  @Field(() => ID)
  sessionId: string;

  @Field(() => String)
  device: string;

  @Field(() => String, { nullable: true })
  ipAddress?: string | null;

  // ISO 8601 string (session DTO serializes Date → toISOString); String, not the DateTime
  // scalar, since GraphQLISODateTime.serialize only accepts Date objects, not strings.
  @Field(() => String)
  lastActive: string;

  @Field(() => Boolean)
  isCurrent: boolean;
}
