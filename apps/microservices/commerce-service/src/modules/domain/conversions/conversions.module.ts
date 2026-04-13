import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { Module } from '@nestjs/common';
import { ConversionsRepository } from './repositories/conversions.repository';
import { ConversionsService } from './services/conversions.service';

@Module({
  imports: [InventoryItemBatchesDomainModule],
  providers: [ConversionsService, ConversionsRepository],
  exports: [ConversionsService, ConversionsRepository],
})
export class ConversionsDomainModule {}
