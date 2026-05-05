import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { InventoryItemLocationsDomainModule } from '@domain/inventory-item-locations/inventory-item-locations.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { Module } from '@nestjs/common';
import { InventoryItemsRepository } from './repositories/inventory-items.repository';
import { InventoryItemsService } from './services/inventory-items.service';

@Module({
  imports: [InventoryItemQuantsDomainModule, InventoryItemLocationsDomainModule, CategoriesDomainModule],
  providers: [InventoryItemsService, InventoryItemsRepository],
  exports: [InventoryItemsService, InventoryItemsRepository],
})
export class InventoryItemsDomainModule {}
