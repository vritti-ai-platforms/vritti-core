import { Module } from '@nestjs/common';
import { InventoryLevelsRepository } from './repositories/inventory-levels.repository';
import { InventoryLevelsService } from './services/inventory-levels.service';

@Module({
  providers: [InventoryLevelsService, InventoryLevelsRepository],
  exports: [InventoryLevelsService],
})
export class InventoryLevelsDomainModule {}
