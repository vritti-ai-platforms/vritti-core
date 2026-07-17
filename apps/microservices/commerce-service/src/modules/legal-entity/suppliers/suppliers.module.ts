import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SuppliersItemsService } from './items/services/suppliers-items.service';
import { SuppliersItemsController } from './items/suppliers-items.controller';
import { SuppliersRootService } from './root/services/suppliers-root.service';
import { SuppliersRootController } from './root/suppliers-root.controller';

@Module({
  imports: [SuppliersDomainModule, SupplierItemsDomainModule, InventoryItemsDomainModule],
  controllers: [SuppliersRootController, SuppliersItemsController],
  providers: [SuppliersItemsService, SuppliersRootService],
})
export class LeSuppliersModule {}
