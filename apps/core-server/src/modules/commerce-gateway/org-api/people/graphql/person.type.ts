import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Person {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  displayName: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => Boolean)
  isActive: boolean;
}
