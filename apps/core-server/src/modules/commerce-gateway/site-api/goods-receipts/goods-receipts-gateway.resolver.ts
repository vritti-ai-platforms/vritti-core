import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { FeedSearchInput } from '../../site-api/inventory-items/graphql/inventory-items-feed.input';
import { GoodsReceipt } from './graphql/goods-receipt.type';
import { GoodsReceiptConnection } from './graphql/goods-receipts-feed.type';
import { GoodsReceiptsGatewayService } from './services/goods-receipts-gateway.service';

// Goods receipts for the mobile screens: a keyset feed (list) + a by-id read (detail).
@Resolver()
export class GoodsReceiptsResolver {
  private readonly logger = new Logger(GoodsReceiptsResolver.name);

  constructor(private readonly goodsReceiptsGatewayService: GoodsReceiptsGatewayService) {}

  // Keyset/cursor Relay connection of goods receipts for the mobile infinite feed.
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Query(() => GoodsReceiptConnection, { name: 'goodsReceiptsFeed' })
  async goodsReceiptsFeed(
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('search', { type: () => FeedSearchInput, nullable: true }) search?: FeedSearchInput | null,
  ): Promise<GoodsReceiptConnection> {
    this.logger.log('QUERY goodsReceiptsFeed');
    return this.goodsReceiptsGatewayService.findForFeed({
      first: first ?? undefined,
      after: after ?? undefined,
      search,
    });
  }

  // Single goods receipt by id — the detail screen read source (client reads it cache-first from the feed).
  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Query(() => GoodsReceipt, { name: 'goodsReceipt' })
  async goodsReceipt(@Args('id', { type: () => ID }) id: string): Promise<GoodsReceipt> {
    this.logger.log('QUERY goodsReceipt');
    return this.goodsReceiptsGatewayService.findById(id);
  }
}
