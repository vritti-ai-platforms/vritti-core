import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

// Per-location stock aggregate for an inventory item (read-only). `id` is composite (`itemId:locationId`)
// so Apollo doesn't collide the same location's row across different items in the normalized cache.
@ObjectType()
export class InventoryItemStockLevel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  locationId: string;

  @Field(() => String, { nullable: true })
  locationName: string | null;

  @Field(() => String, { nullable: true })
  locationPath: string | null;

  @Field(() => Float)
  stockedQuantity: number;

  @Field(() => Float)
  reservedQuantity: number;

  @Field(() => Float)
  availableQuantity: number;

  @Field(() => Float, { nullable: true })
  reorderLevel: number | null;
}

// Relay Cursor Connection — Apollo's relayStylePagination merges pages in the client cache. Names are
// stock-level-scoped to avoid global GraphQL type-name collisions (NestJS code-first).
@ObjectType()
export class InventoryItemStockLevelPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class InventoryItemStockLevelEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => InventoryItemStockLevel)
  node: InventoryItemStockLevel;
}

@ObjectType()
export class InventoryItemStockLevelConnection {
  @Field(() => [InventoryItemStockLevelEdge])
  edges: InventoryItemStockLevelEdge[];

  @Field(() => InventoryItemStockLevelPageInfo)
  pageInfo: InventoryItemStockLevelPageInfo;
}
