import { Module } from '@nestjs/common';
import { InventoryLevelsDomainModule } from '@domain/inventory-levels/inventory-levels.module';
import { InventoryItemsRepository } from './repositories/inventory-items.repository';
import { InventoryItemsService } from './services/inventory-items.service';

@Module({
  imports: [InventoryLevelsDomainModule],
  providers: [InventoryItemsService, InventoryItemsRepository],
  exports: [InventoryItemsService, InventoryItemsRepository],
})
export class InventoryItemsDomainModule {}
