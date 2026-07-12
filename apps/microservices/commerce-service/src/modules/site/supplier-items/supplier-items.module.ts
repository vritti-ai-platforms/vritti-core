import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { Module } from '@nestjs/common';
import { SupplierItemsController } from './supplier-items.controller';

@Module({
  imports: [SupplierItemsDomainModule],
  controllers: [SupplierItemsController],
})
export class SiteSupplierItemsModule {}
