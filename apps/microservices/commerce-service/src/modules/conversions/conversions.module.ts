import { ConversionsDomainModule } from '@domain/conversions/conversions.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { Module } from '@nestjs/common';
import { ConversionsController } from './conversions.controller';
import { ConversionsRootService } from './services/conversions-root.service';

@Module({
  imports: [ConversionsDomainModule, InventoryItemQuantsDomainModule, InventoryItemLotsDomainModule],
  controllers: [ConversionsController],
  providers: [ConversionsRootService],
})
export class ConversionsModule {}
