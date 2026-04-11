import { Module } from '@nestjs/common';
import { InventoryLevelsDomainModule } from '@domain/inventory-levels/inventory-levels.module';
import { ConversionsRepository } from './repositories/conversions.repository';
import { ConversionsService } from './services/conversions.service';

@Module({
  imports: [InventoryLevelsDomainModule],
  providers: [ConversionsService, ConversionsRepository],
  exports: [ConversionsService, ConversionsRepository],
})
export class ConversionsDomainModule {}
