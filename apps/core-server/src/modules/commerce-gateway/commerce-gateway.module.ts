import { Module } from '@nestjs/common';
import { BomGatewayController } from './bom/bom-gateway.controller';
import { BomGatewayService } from './bom/services/bom-gateway.service';
import { CategoriesGatewayController } from './categories/categories-gateway.controller';
import { CategoriesGatewayService } from './categories/services/categories-gateway.service';
import { ConversionsGatewayController } from './conversions/conversions-gateway.controller';
import { ConversionsGatewayService } from './conversions/services/conversions-gateway.service';
import { CreditNotesGatewayController } from './credit-notes/credit-notes-gateway.controller';
import { CreditNotesGatewayService } from './credit-notes/services/credit-notes-gateway.service';
import { GoodsReceiptsGatewayController } from './goods-receipts/goods-receipts-gateway.controller';
import { GoodsReceiptsGatewayService } from './goods-receipts/services/goods-receipts-gateway.service';
import { InventoryItemsGatewayController } from './inventory-items/inventory-items-gateway.controller';
import { InventoryItemsGatewayService } from './inventory-items/services/inventory-items-gateway.service';
import { StorageLocationsGatewayController } from './storage-locations/storage-locations-gateway.controller';
import { StorageLocationsGatewayService } from './storage-locations/services/storage-locations-gateway.service';
import { InvoicesGatewayController } from './invoices/invoices-gateway.controller';
import { InvoicesGatewayService } from './invoices/services/invoices-gateway.service';
import { ItemsGatewayController } from './items/items-gateway.controller';
import { ItemsGatewayService } from './items/services/items-gateway.service';
import { ModifierGroupsGatewayController } from './modifier-groups/modifier-groups-gateway.controller';
import { ModifierGroupsGatewayService } from './modifier-groups/services/modifier-groups-gateway.service';
import { PaymentsGatewayController } from './payments/payments-gateway.controller';
import { PaymentsGatewayService } from './payments/services/payments-gateway.service';
import { PurchaseOrdersGatewayController } from './purchase-orders/purchase-orders-gateway.controller';
import { PurchaseOrdersGatewayService } from './purchase-orders/services/purchase-orders-gateway.service';
import { StockAdjustmentsGatewayController } from './stock-adjustments/stock-adjustments-gateway.controller';
import { StockAdjustmentsGatewayService } from './stock-adjustments/services/stock-adjustments-gateway.service';
import { StockTransfersGatewayController } from './stock-transfers/stock-transfers-gateway.controller';
import { StockTransfersGatewayService } from './stock-transfers/services/stock-transfers-gateway.service';
import { OrdersGatewayController } from './orders/orders-gateway.controller';
import { OrdersGatewayService } from './orders/services/orders-gateway.service';
import { SuppliersGatewayController } from './suppliers/suppliers-gateway.controller';
import { SuppliersGatewayService } from './suppliers/services/suppliers-gateway.service';
import { TaxGroupsGatewayService } from './tax-groups/services/tax-groups-gateway.service';
import { TaxGroupsGatewayController } from './tax-groups/tax-groups-gateway.controller';
import { UomGatewayController } from './uom/uom-gateway.controller';
import { UomGatewayService } from './uom/services/uom-gateway.service';

@Module({
  controllers: [
    BomGatewayController,
    CategoriesGatewayController,
    ConversionsGatewayController,
    CreditNotesGatewayController,
    GoodsReceiptsGatewayController,
    InventoryItemsGatewayController,
    StorageLocationsGatewayController,
    InvoicesGatewayController,
    ItemsGatewayController,
    ModifierGroupsGatewayController,
    OrdersGatewayController,
    PaymentsGatewayController,
    PurchaseOrdersGatewayController,
    StockAdjustmentsGatewayController,
    StockTransfersGatewayController,
    SuppliersGatewayController,
    TaxGroupsGatewayController,
    UomGatewayController,
  ],
  providers: [
    BomGatewayService,
    CategoriesGatewayService,
    ConversionsGatewayService,
    CreditNotesGatewayService,
    GoodsReceiptsGatewayService,
    InventoryItemsGatewayService,
    StorageLocationsGatewayService,
    InvoicesGatewayService,
    ItemsGatewayService,
    ModifierGroupsGatewayService,
    OrdersGatewayService,
    PaymentsGatewayService,
    PurchaseOrdersGatewayService,
    StockAdjustmentsGatewayService,
    StockTransfersGatewayService,
    SuppliersGatewayService,
    TaxGroupsGatewayService,
    UomGatewayService,
  ],
})
export class CommerceGatewayModule {}
