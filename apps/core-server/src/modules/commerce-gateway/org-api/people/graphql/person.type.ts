import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * A person party, as an app caller sees one.
 *
 * Leaner than `PersonResponseDto`, which the staff table also uses: an app
 * registering someone needs the id to store and enough to echo back, not the
 * primary address or the party-type discriminator.
 */
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
