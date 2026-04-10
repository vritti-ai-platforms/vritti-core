import { Module } from '@nestjs/common';
import { BomGatewayController } from './bom/bom-gateway.controller';
import { BomGatewayService } from './bom/services/bom-gateway.service';
import { CategoriesGatewayController } from './categories/categories-gateway.controller';
import { CategoriesGatewayService } from './categories/services/categories-gateway.service';
import { InventoryItemsGatewayController } from './inventory-items/inventory-items-gateway.controller';
import { InventoryItemsGatewayService } from './inventory-items/services/inventory-items-gateway.service';
import { ItemsGatewayController } from './items/items-gateway.controller';
import { ItemsGatewayService } from './items/services/items-gateway.service';
import { ModifierGroupsGatewayController } from './modifier-groups/modifier-groups-gateway.controller';
import { ModifierGroupsGatewayService } from './modifier-groups/services/modifier-groups-gateway.service';
import { TaxGroupsGatewayService } from './tax-groups/services/tax-groups-gateway.service';
import { TaxGroupsGatewayController } from './tax-groups/tax-groups-gateway.controller';
import { UomGatewayController } from './uom/uom-gateway.controller';
import { UomGatewayService } from './uom/services/uom-gateway.service';

@Module({
  controllers: [
    BomGatewayController,
    CategoriesGatewayController,
    InventoryItemsGatewayController,
    ItemsGatewayController,
    ModifierGroupsGatewayController,
    TaxGroupsGatewayController,
    UomGatewayController,
  ],
  providers: [
    BomGatewayService,
    CategoriesGatewayService,
    InventoryItemsGatewayService,
    ItemsGatewayService,
    ModifierGroupsGatewayService,
    TaxGroupsGatewayService,
    UomGatewayService,
  ],
})
export class CommerceGatewayModule {}
