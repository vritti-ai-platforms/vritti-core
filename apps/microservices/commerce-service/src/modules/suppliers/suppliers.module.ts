import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierContactsDomainModule } from '@domain/supplier-contacts/supplier-contacts.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SuppliersContactsController } from './contacts/suppliers-contacts.controller';
import { SuppliersItemsService } from './items/services/suppliers-items.service';
import { SuppliersItemsController } from './items/suppliers-items.controller';
import { SuppliersRootService } from './root/services/suppliers-root.service';
import { SuppliersRootController } from './root/suppliers-root.controller';

@Module({
  imports: [SuppliersDomainModule, SupplierContactsDomainModule, SupplierItemsDomainModule, InventoryItemsDomainModule],
  controllers: [SuppliersRootController, SuppliersContactsController, SuppliersItemsController],
  providers: [SuppliersItemsService, SuppliersRootService],
})
export class SuppliersModule {}
