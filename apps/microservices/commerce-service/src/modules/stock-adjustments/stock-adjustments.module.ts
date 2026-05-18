import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { InventoryItemLedgerDomainModule } from '@domain/inventory-item-ledger/inventory-item-ledger.module';
import { StockAdjustmentLineItemsDomainModule } from '@domain/stock-adjustment-line-items/stock-adjustment-line-items.module';
import { StockAdjustmentLinesDomainModule } from '@domain/stock-adjustment-lines/stock-adjustment-lines.module';
import { StockAdjustmentLotsDomainModule } from '@domain/stock-adjustment-lots/stock-adjustment-lots.module';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentsLineItemsTransactionService } from './line-items/services/stock-adjustments-line-items-transaction.service';
import { StockAdjustmentsLineItemsController } from './line-items/stock-adjustments-line-items.controller';
import { StockAdjustmentsLinesService } from './lines/services/stock-adjustments-lines.service';
import { StockAdjustmentsLinesController } from './lines/stock-adjustments-lines.controller';
import { StockAdjustmentsLotsService } from './lots/services/stock-adjustments-lots.service';
import { StockAdjustmentsLotsController } from './lots/stock-adjustments-lots.controller';
import { StockAdjustmentsRootService } from './root/services/stock-adjustments-root.service';
import { StockAdjustmentsRootController } from './root/stock-adjustments-root.controller';

@Module({
  imports: [
    StockAdjustmentsDomainModule,
    StockAdjustmentLotsDomainModule,
    StockAdjustmentLinesDomainModule,
    StockAdjustmentLineItemsDomainModule,
    InventoryItemsDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemUomConversionsDomainModule,
    InventoryItemLedgerDomainModule,
    UomDomainModule,
  ],
  controllers: [
    StockAdjustmentsRootController,
    StockAdjustmentsLotsController,
    StockAdjustmentsLinesController,
    StockAdjustmentsLineItemsController,
  ],
  providers: [
    StockAdjustmentsRootService,
    StockAdjustmentsLotsService,
    StockAdjustmentsLinesService,
    StockAdjustmentsLineItemsTransactionService,
  ],
})
export class StockAdjustmentsModule {}
