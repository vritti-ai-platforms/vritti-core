import { Module } from '@nestjs/common';
import { CategoriesGatewayController } from './categories/categories-gateway.controller';
import { CategoriesGatewayService } from './categories/services/categories-gateway.service';
import { ItemsGatewayController } from './items/items-gateway.controller';
import { ItemsGatewayService } from './items/services/items-gateway.service';
import { ModifierGroupsGatewayController } from './modifier-groups/modifier-groups-gateway.controller';
import { ModifierGroupsGatewayService } from './modifier-groups/services/modifier-groups-gateway.service';
import { TaxGroupsGatewayService } from './tax-groups/services/tax-groups-gateway.service';
import { TaxGroupsGatewayController } from './tax-groups/tax-groups-gateway.controller';

@Module({
  controllers: [
    CategoriesGatewayController,
    ItemsGatewayController,
    ModifierGroupsGatewayController,
    TaxGroupsGatewayController,
  ],
  providers: [
    CategoriesGatewayService,
    ItemsGatewayService,
    ModifierGroupsGatewayService,
    TaxGroupsGatewayService,
  ],
})
export class CommerceGatewayModule {}
