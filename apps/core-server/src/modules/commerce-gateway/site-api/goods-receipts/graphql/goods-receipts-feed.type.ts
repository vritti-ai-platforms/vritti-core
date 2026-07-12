import { Field, ObjectType } from '@nestjs/graphql';
import { GoodsReceipt } from './goods-receipt.type';

@ObjectType()
export class GoodsReceiptPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class GoodsReceiptEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => GoodsReceipt)
  node: GoodsReceipt;
}

@ObjectType()
export class GoodsReceiptConnection {
  @Field(() => [GoodsReceiptEdge])
  edges: GoodsReceiptEdge[];

  @Field(() => GoodsReceiptPageInfo)
  pageInfo: GoodsReceiptPageInfo;
}
