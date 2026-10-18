import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

// One stock movement journal entry for an inventory item (read-only).
@ObjectType()
export class InventoryItemLedgerEntry {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  type: string;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float, { nullable: true })
  balanceAfter: number | null;

  @Field(() => String, { nullable: true })
  referenceType: string | null;

  @Field(() => ID, { nullable: true })
  referenceId: string | null;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => String)
  createdAt: string;
}

// Relay Cursor Connection — Apollo's relayStylePagination merges pages in the client cache.
@ObjectType()
export class InventoryItemLedgerPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class InventoryItemLedgerEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => InventoryItemLedgerEntry)
  node: InventoryItemLedgerEntry;
}

@ObjectType()
export class InventoryItemLedgerConnection {
  @Field(() => [InventoryItemLedgerEdge])
  edges: InventoryItemLedgerEdge[];

  @Field(() => InventoryItemLedgerPageInfo)
  pageInfo: InventoryItemLedgerPageInfo;
}
