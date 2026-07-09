import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LookupOrganization {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  subdomain: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;
}
