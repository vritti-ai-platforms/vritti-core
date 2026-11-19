import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { LocationQuantsController } from './location-quants.controller';
import { LocationQuantsService } from './services/location-quants.service';

@Module({
  imports: [InventoryItemQuantsDomainModule, UomConversionsDomainModule],
  controllers: [LocationQuantsController],
  providers: [LocationQuantsService],
})
export class SiteLocationQuantsModule {}
