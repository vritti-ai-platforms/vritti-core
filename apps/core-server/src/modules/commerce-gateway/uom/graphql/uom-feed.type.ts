import { Field, ObjectType } from '@nestjs/graphql';
import { Uom } from './uom.type';

// Relay Cursor Connections spec — Apollo's relayStylePagination merges these in the cache (client).
// Names are uom-scoped to avoid global GraphQL type-name collisions (NestJS code-first).
@ObjectType()
export class UomPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class UomEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => Uom)
  node: Uom;
}

@ObjectType()
export class UomConnection {
  @Field(() => [UomEdge])
  edges: UomEdge[];

  @Field(() => UomPageInfo)
  pageInfo: UomPageInfo;
}
