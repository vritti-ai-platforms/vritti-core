import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { Module } from '@nestjs/common';
import { ConversionsRepository } from './repositories/conversions.repository';
import { ConversionsService } from './services/conversions.service';

@Module({
  imports: [InventoryItemQuantsDomainModule],
  providers: [ConversionsService, ConversionsRepository],
  exports: [ConversionsService, ConversionsRepository],
})
export class ConversionsDomainModule {}
