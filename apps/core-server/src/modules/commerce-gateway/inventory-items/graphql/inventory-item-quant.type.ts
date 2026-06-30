import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

// One physical stock segment for an inventory item (read-only) — a quant at a (location, lot, cost) batch.
// `id` is the quant's own uuid, so Apollo's normalized cache keys it directly.
@ObjectType()
export class InventoryItemQuant {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  locationId: string;

  @Field(() => String, { nullable: true })
  locationName: string | null;

  @Field(() => String, { nullable: true })
  locationPath: string | null;

  @Field(() => ID, { nullable: true })
  lotId: string | null;

  @Field(() => String, { nullable: true })
  lotNumber: string | null;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float)
  reservedQuantity: number;

  @Field(() => Float)
  availableQuantity: number;

  @Field(() => String, { nullable: true })
  manufacturingDate: string | null;

  @Field(() => String, { nullable: true })
  expiryDate: string | null;

  @Field(() => String)
  createdAt: string;
}

// Relay Cursor Connection — Apollo's relayStylePagination merges pages in the client cache. Names are
// quant-scoped to avoid global GraphQL type-name collisions (NestJS code-first).
@ObjectType()
export class InventoryItemQuantPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class InventoryItemQuantEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => InventoryItemQuant)
  node: InventoryItemQuant;
}

@ObjectType()
export class InventoryItemQuantConnection {
  @Field(() => [InventoryItemQuantEdge])
  edges: InventoryItemQuantEdge[];

  @Field(() => InventoryItemQuantPageInfo)
  pageInfo: InventoryItemQuantPageInfo;
}
