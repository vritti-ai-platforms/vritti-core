import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { InventoryItemSupplierConnection } from './graphql/inventory-item-supplier.type';
import { SiteInventoryItemsGatewayService } from './services/inventory-items-gateway.service';

// Read-only per-inventory-item supplier links for the mobile Suppliers tab — a Relay offset feed (an item can
// have many suppliers). Thin forward to the gateway (which paginates via the commerce-service DB).
@Resolver()
export class InventoryItemSuppliersResolver {
  private readonly logger = new Logger(InventoryItemSuppliersResolver.name);

  constructor(private readonly inventoryItemsGatewayService: SiteInventoryItemsGatewayService) {}

  @Require(AuthType.Session, SessionTypeValues.MOBILE)
  @Query(() => InventoryItemSupplierConnection, { name: 'inventoryItemSuppliers' })
  async inventoryItemSuppliers(
    @Args('inventoryItemId', { type: () => ID }) inventoryItemId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<InventoryItemSupplierConnection> {
    this.logger.log('QUERY inventoryItemSuppliers');
    return this.inventoryItemsGatewayService.findSuppliersForFeed({ inventoryItemId, first, after });
  }
}
