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

  @Field(() => String)
  createdAt: string;

  @Field(() => String, { nullable: true })
  lastLoginAt?: string | null;

  // Signed, so it expires — clients must re-query rather than cache it indefinitely
  @Field(() => String, { nullable: true })
  profilePictureUrl?: string | null;
}
