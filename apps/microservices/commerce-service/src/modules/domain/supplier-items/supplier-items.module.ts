import { Module } from '@nestjs/common';
import { SupplierItemsRepository } from './repositories/supplier-items.repository';
import { SupplierItemsService } from './services/supplier-items.service';

@Module({
  providers: [SupplierItemsService, SupplierItemsRepository],
  exports: [SupplierItemsService, SupplierItemsRepository],
})
export class SupplierItemsDomainModule {}
