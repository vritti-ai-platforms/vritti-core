import { GoodsReceiptLineItemsDomainModule } from '@domain/goods-receipt-line-items/goods-receipt-line-items.module';
import { GoodsReceiptLinesDomainModule } from '@domain/goods-receipt-lines/goods-receipt-lines.module';
import { GoodsReceiptLotsDomainModule } from '@domain/goods-receipt-lots/goods-receipt-lots.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemLedgerDomainModule } from '@domain/inventory-item-ledger/inventory-item-ledger.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { SupplierSitesDomainModule } from '@domain/supplier-sites/supplier-sites.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptsItemsController } from './items/goods-receipts-items.controller';
import { GoodsReceiptsLineItemsController } from './line-items/goods-receipts-line-items.controller';
import { GoodsReceiptsLinesController } from './lines/goods-receipts-lines.controller';
import { GoodsReceiptsLinesService } from './lines/services/goods-receipts-lines.service';
import { GoodsReceiptsLotsController } from './lots/goods-receipts-lots.controller';
import { GoodsReceiptsRootController } from './root/goods-receipts-root.controller';
import { GoodsReceiptsPublishService } from './root/services/goods-receipts-publish.service';
import { GoodsReceiptsService } from './root/services/goods-receipts-root.service';

@Module({
  imports: [
    GoodsReceiptsDomainModule,
    GoodsReceiptLotsDomainModule,
    GoodsReceiptLinesDomainModule,
    GoodsReceiptLineItemsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemsDomainModule,
    InventoryItemLedgerDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemMrpsDomainModule,
    PurchaseOrderItemsDomainModule,
    SuppliersDomainModule,
    SupplierSitesDomainModule,
    UomConversionsDomainModule,
  ],
  controllers: [
    GoodsReceiptsRootController,
    GoodsReceiptsItemsController,
    GoodsReceiptsLotsController,
    GoodsReceiptsLinesController,
    GoodsReceiptsLineItemsController,
  ],
  providers: [GoodsReceiptsService, GoodsReceiptsPublishService, GoodsReceiptsLinesService],
})
export class SiteGoodsReceiptsModule {}
