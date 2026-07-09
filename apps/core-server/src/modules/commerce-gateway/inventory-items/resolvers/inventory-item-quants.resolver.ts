import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemQuantConnection } from '../graphql/inventory-item-quant.type';
import { InventoryItemsGatewayService } from '../services/inventory-items-gateway.service';

// Read-only per-quant feed for an inventory item — a Relay connection (offset cursor) for the mobile
// infinite-scroll Quants tab. Thin forward to the gateway (which paginates via the commerce-service DB).
@Resolver()
export class InventoryItemQuantsFeedResolver {
  private readonly logger = new Logger(InventoryItemQuantsFeedResolver.name);

  constructor(private readonly inventoryItemsGatewayService: InventoryItemsGatewayService) {}

  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => InventoryItemQuantConnection, { name: 'inventoryItemQuants' })
  async inventoryItemQuants(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<InventoryItemQuantConnection> {
    this.logger.log('QUERY inventoryItemQuants');
    return this.inventoryItemsGatewayService.findQuantsForFeed({ inventoryItemId, first, after });
  }
}
