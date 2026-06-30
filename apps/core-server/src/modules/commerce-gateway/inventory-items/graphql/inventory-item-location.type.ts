import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

// Per-item location config (the "Locations" tab — reorder threshold per storage location). Has a real unique
// `id` (the inventory_item_locations row), so no composite id is needed for cache normalization.
@ObjectType()
export class InventoryItemLocation {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  inventoryItemId: string;

  @Field(() => ID)
  locationId: string;

  @Field(() => String, { nullable: true })
  locationName: string | null;

  @Field(() => String, { nullable: true })
  locationPath: string | null;

  @Field(() => Float)
  reorderLevel: number;
}

// Relay Cursor Connection — Apollo's relayStylePagination merges pages in the client cache. Names are
// location-scoped to avoid global GraphQL type-name collisions (NestJS code-first).
@ObjectType()
export class InventoryItemLocationPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class InventoryItemLocationEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => InventoryItemLocation)
  node: InventoryItemLocation;
}

@ObjectType()
export class InventoryItemLocationConnection {
  @Field(() => [InventoryItemLocationEdge])
  edges: InventoryItemLocationEdge[];

  @Field(() => InventoryItemLocationPageInfo)
  pageInfo: InventoryItemLocationPageInfo;
}
