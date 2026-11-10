import { GoodsReceiptLineItemsDomainModule } from '@domain/goods-receipt-line-items/goods-receipt-line-items.module';
import { GoodsReceiptLinesDomainModule } from '@domain/goods-receipt-lines/goods-receipt-lines.module';
import { GoodsReceiptLotsDomainModule } from '@domain/goods-receipt-lots/goods-receipt-lots.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { InventoryItemLedgerDomainModule } from '@domain/inventory-item-ledger/inventory-item-ledger.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptsItemsController } from './items/goods-receipts-items.controller';
import { GoodsReceiptsItemsService } from './items/services/goods-receipts-items.service';
import { GoodsReceiptsLineItemsController } from './line-items/goods-receipts-line-items.controller';
import { GoodsReceiptsLineItemsService } from './line-items/services/goods-receipts-line-items.service';
import { GoodsReceiptsLinesController } from './lines/goods-receipts-lines.controller';
import { GoodsReceiptsLinesService } from './lines/services/goods-receipts-lines.service';
import { GoodsReceiptsLotsController } from './lots/goods-receipts-lots.controller';
import { GoodsReceiptsLotsService } from './lots/services/goods-receipts-lots.service';
import { GoodsReceiptsRootController } from './root/goods-receipts-root.controller';
import { GoodsReceiptsPublishService } from './root/services/goods-receipts-publish.service';
import { GoodsReceiptsService } from './root/services/goods-receipts-root.service';

@Module({
  imports: [
    GoodsReceiptsDomainModule,
    GoodsReceiptLotsDomainModule,
    GoodsReceiptLinesDomainModule,
    GoodsReceiptLineItemsDomainModule,
    InboundDeliveriesDomainModule,
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    SupplierEnrollmentsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemLedgerDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemMrpsDomainModule,
    InventoryItemSitesDomainModule,
    UomConversionsDomainModule,
  ],
  controllers: [
    GoodsReceiptsRootController,
    GoodsReceiptsItemsController,
    GoodsReceiptsLotsController,
    GoodsReceiptsLinesController,
    GoodsReceiptsLineItemsController,
  ],
  providers: [
    // Root
    GoodsReceiptsService,
    GoodsReceiptsPublishService,
    // Items
    GoodsReceiptsItemsService,
    // Lots
    GoodsReceiptsLotsService,
    // Lines
    GoodsReceiptsLinesService,
    // Line items
    GoodsReceiptsLineItemsService,
  ],
  exports: [
    GoodsReceiptsService,
    GoodsReceiptsPublishService,
    GoodsReceiptsItemsService,
    GoodsReceiptsLotsService,
    GoodsReceiptsLinesService,
    GoodsReceiptsLineItemsService,
  ],
})
export class SiteGoodsReceiptsModule {}
