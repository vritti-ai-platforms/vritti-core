import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from './json.scalar';

// Shared GraphQL types for Select dropdown option queries (`<entity>Options`). Mirrors api-sdk
// SelectQueryResult / SelectQueryOption and is defined ONCE, reused by every entity's options resolver.
// TS field types keep the source union (value/id/groupId can be number) while the GraphQL field is String —
// graphql-js coerces on serialize, so a gateway `SelectQueryResult` is structurally assignable as-is.
@ObjectType()
export class SelectOption {
  @Field(() => String)
  value: string | number | boolean;

  @Field(() => String)
  label: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  groupId?: string | number | null;

  @Field(() => GraphQLJSON, { nullable: true })
  additionals?: Record<string, string | number | boolean | null> | null;
}

@ObjectType()
export class SelectGroup {
  @Field(() => String)
  id: string | number;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class SelectOptions {
  @Field(() => [SelectOption])
  options: SelectOption[];

  @Field(() => [SelectGroup], { nullable: true })
  groups?: SelectGroup[] | null;

  @Field(() => Boolean)
  hasMore: boolean;

  @Field(() => Int, { nullable: true })
  totalCount?: number | null;
}
