import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemLedgerConnection } from './graphql/inventory-item-ledger.type';
import { SiteInventoryItemsGatewayService } from './services/inventory-items-gateway.service';

// Read-only ledger feed for an inventory item — a Relay connection (offset cursor) for the mobile
// infinite-scroll Ledger tab. Thin forward to the gateway (which paginates via the commerce-service DB).
@Resolver()
export class InventoryItemLedgerResolver {
  private readonly logger = new Logger(InventoryItemLedgerResolver.name);

  constructor(private readonly inventoryItemsGatewayService: SiteInventoryItemsGatewayService) {}

  @RequireSession(SessionTypeValues.MOBILE)
  @Query(() => InventoryItemLedgerConnection, { name: 'inventoryItemLedger' })
  async inventoryItemLedger(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<InventoryItemLedgerConnection> {
    this.logger.log('QUERY inventoryItemLedger');
    return this.inventoryItemsGatewayService.findLedgerForFeed({ inventoryItemId, first, after });
  }
}
