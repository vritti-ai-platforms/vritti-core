import { Field, ID, ObjectType } from '@nestjs/graphql';

// Per-item fixed location (the "Locations" tab — a storage location the item is fixed to, optionally blocked).
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

  @Field(() => Boolean)
  isBlocked: boolean;
}

// Relay Cursor Connection — Apollo's relayStylePagination merges pages in the client cache.
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
