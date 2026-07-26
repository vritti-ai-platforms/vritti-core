import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemStockLevelConnection } from './graphql/inventory-item-stock-level.type';
import { SiteInventoryItemsGatewayService } from './services/inventory-items-gateway.service';

// Read-only per-location stock levels for an inventory item — a Relay connection (offset cursor) for the
// mobile infinite-scroll tab. Thin forward to the gateway (which paginates via the commerce-service DB).
@Resolver()
export class InventoryItemStockLevelsResolver {
  private readonly logger = new Logger(InventoryItemStockLevelsResolver.name);

  constructor(private readonly inventoryItemsGatewayService: SiteInventoryItemsGatewayService) {}

  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => InventoryItemStockLevelConnection, { name: 'inventoryItemStockLevels' })
  async inventoryItemStockLevels(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<InventoryItemStockLevelConnection> {
    this.logger.log('QUERY inventoryItemStockLevels');
    return this.inventoryItemsGatewayService.findStockLevelsForFeed({ inventoryItemId, first, after });
  }
}
