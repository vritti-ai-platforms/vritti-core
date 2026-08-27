import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { FeedSearchInput } from '../../site-api/inventory-items/graphql/inventory-items-feed.input';
import { GoodsReceipt } from './graphql/goods-receipt.type';
import { GoodsReceiptConnection } from './graphql/goods-receipts-feed.type';
import { GoodsReceiptsGatewayService } from './services/goods-receipts-gateway.service';

// Goods receipts for the mobile screens: a keyset feed (list) + a by-id read (detail). Read-only — GR creation
// is a PO-linked flow not exposed on mobile. Thin forwards to the gateway service (which NATS-forwards to
// commerce-service). buId flows via NATS context from @Require(AuthType.Session).
@Resolver()
export class GoodsReceiptsResolver {
  private readonly logger = new Logger(GoodsReceiptsResolver.name);

  constructor(private readonly goodsReceiptsGatewayService: GoodsReceiptsGatewayService) {}

  // Keyset/cursor Relay connection of goods receipts for the mobile infinite feed. Relay args (first/after)
  // map to limit/cursor; the client merges pages via relayStylePagination. Fixed sort (newest first) server-side.
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
