import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersGoodsReceiptsController } from './goods-receipts/purchase-orders-goods-receipts.controller';
import { PurchaseOrdersItemsController } from './items/purchase-orders-items.controller';
import { PurchaseOrdersItemsService } from './items/services/purchase-orders-items.service';
import { PurchaseOrdersRootController } from './root/purchase-orders-root.controller';
import { PurchaseOrdersRootService } from './root/services/purchase-orders-root.service';

@Module({
  imports: [
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    GoodsReceiptsDomainModule,
    SuppliersDomainModule,
    SupplierItemsDomainModule,
    InventoryItemUomConversionsDomainModule,
  ],
  controllers: [PurchaseOrdersRootController, PurchaseOrdersItemsController, PurchaseOrdersGoodsReceiptsController],
  providers: [PurchaseOrdersRootService, PurchaseOrdersItemsService],
})
export class PurchaseOrdersModule {}
