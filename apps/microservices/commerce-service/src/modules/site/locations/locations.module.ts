import { InventoryItemStorageTypesDomainModule } from '@domain/inventory-item-storage-types/inventory-item-storage-types.module';
import { LocationsDomainModule } from '@domain/locations/locations.module';
import { StorageTypesDomainModule } from '@domain/storage-types/storage-types.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { LocationsController } from './root/locations.controller';
import { SiteLocationsService } from './root/services/locations-root.service';

@Module({
  imports: [
    LocationsDomainModule,
    StorageTypesDomainModule,
    InventoryItemStorageTypesDomainModule,
    UomConversionsDomainModule,
  ],
  controllers: [LocationsController],
  providers: [SiteLocationsService],
})
export class SiteLocationsModule {}
