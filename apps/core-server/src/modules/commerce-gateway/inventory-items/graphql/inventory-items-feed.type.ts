import { Field, ObjectType } from '@nestjs/graphql';
import { InventoryItem } from './inventory-item.type';

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
