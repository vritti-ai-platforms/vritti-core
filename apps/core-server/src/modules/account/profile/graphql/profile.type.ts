import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  fullName: string;

  @Field(() => String, { nullable: true })
  displayName?: string | null;

  @Field(() => String)
  status: string;

  @Field(() => Boolean)
  hasPassword: boolean;

  @Field(() => String)
  locale: string;

  @Field(() => String)
  timezone: string;

  // ISO 8601 string (ProfileDto serializes Date → toISOString); String, not the DateTime
  // scalar, since GraphQLISODateTime.serialize only accepts Date objects, not strings.
  @Field(() => String)
  createdAt: string;

  @Field(() => String, { nullable: true })
  lastLoginAt?: string | null;
}
