import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { Module } from '@nestjs/common';
import { LocationQuantsController } from './location-quants.controller';

@Module({
  imports: [InventoryItemQuantsDomainModule],
  controllers: [LocationQuantsController],
})
export class SiteLocationQuantsModule {}
