import { Module } from '@nestjs/common';
import { UserDomainModule } from '@domain/user/user.module';
import { CategoriesGatewayController } from './categories/categories-gateway.controller';
import { CategoriesGatewayService } from './categories/services/categories-gateway.service';
import { CommerceClientModule } from './commerce-client.module';
import { ItemsGatewayController } from './items/items-gateway.controller';
import { ItemsGatewayService } from './items/services/items-gateway.service';
import { ModifierGroupsGatewayController } from './modifier-groups/modifier-groups-gateway.controller';
import { ModifierGroupsGatewayService } from './modifier-groups/services/modifier-groups-gateway.service';
import { TaxGroupsGatewayController } from './tax-groups/tax-groups-gateway.controller';
import { TaxGroupsGatewayService } from './tax-groups/services/tax-groups-gateway.service';

@Module({
  imports: [CommerceClientModule, UserDomainModule],
  controllers: [
    CategoriesGatewayController,
    ItemsGatewayController,
    ModifierGroupsGatewayController,
    TaxGroupsGatewayController,
  ],
  providers: [
    // Categories
    CategoriesGatewayService,
    // Items
    ItemsGatewayService,
    // Modifier Groups
    ModifierGroupsGatewayService,
    // Tax Groups
    TaxGroupsGatewayService,
  ],
})
export class CommerceGatewayModule {}
