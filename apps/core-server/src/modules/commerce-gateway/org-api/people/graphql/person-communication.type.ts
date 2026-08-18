import { Field, ID, ObjectType } from '@nestjs/graphql';

/** A communication row, as an app caller sees one after adding it. */
@ObjectType()
export class PersonCommunication {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  channel: string;

  @Field(() => String)
  value: string;

  @Field(() => Boolean)
  isPrimary: boolean;

  @Field(() => Boolean)
  isActive: boolean;
}
