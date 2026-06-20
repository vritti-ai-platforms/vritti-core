import { Field, ObjectType } from '@nestjs/graphql';
import { InventoryItem } from './inventory-item.type';

// Relay Cursor Connections spec — Apollo's relayStylePagination merges these in the cache (client).
// Names are inventory-scoped to avoid global GraphQL type-name collisions (NestJS code-first).
@ObjectType()
export class InventoryItemPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class InventoryItemEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => InventoryItem)
  node: InventoryItem;
}

@ObjectType()
export class InventoryItemConnection {
  @Field(() => [InventoryItemEdge])
  edges: InventoryItemEdge[];

  @Field(() => InventoryItemPageInfo)
  pageInfo: InventoryItemPageInfo;
}
