import { Module } from '@nestjs/common';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { PurchaseOrderItemsRepository } from './repositories/purchase-order-items.repository';
import { PurchaseOrdersRepository } from './repositories/purchase-orders.repository';
import { PurchaseOrdersService } from './services/purchase-orders.service';

@Module({
  imports: [SuppliersDomainModule],
  providers: [PurchaseOrdersService, PurchaseOrdersRepository, PurchaseOrderItemsRepository],
  exports: [PurchaseOrdersService, PurchaseOrdersRepository, PurchaseOrderItemsRepository],
})
export class PurchaseOrdersDomainModule {}
