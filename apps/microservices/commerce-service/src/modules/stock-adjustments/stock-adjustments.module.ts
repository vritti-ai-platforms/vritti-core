import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { StockAdjustmentLineItemsDomainModule } from '@domain/stock-adjustment-line-items/stock-adjustment-line-items.module';
import { StockAdjustmentLinesDomainModule } from '@domain/stock-adjustment-lines/stock-adjustment-lines.module';
import { StockAdjustmentLotsDomainModule } from '@domain/stock-adjustment-lots/stock-adjustment-lots.module';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentsLineItemsTransactionService } from './line-items/services/stock-adjustments-line-items-transaction.service';
import { StockAdjustmentsLineItemsController } from './line-items/stock-adjustments-line-items.controller';
import { StockAdjustmentsLinesController } from './lines/stock-adjustments-lines.controller';
import { StockAdjustmentsLotsController } from './lots/stock-adjustments-lots.controller';
import { StockAdjustmentsRootService } from './root/services/stock-adjustments-root.service';
import { StockAdjustmentsRootController } from './root/stock-adjustments-root.controller';

@Module({
  imports: [
    StockAdjustmentsDomainModule,
    StockAdjustmentLotsDomainModule,
    StockAdjustmentLinesDomainModule,
    StockAdjustmentLineItemsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryLedgerDomainModule,
  ],
  controllers: [
    StockAdjustmentsRootController,
    StockAdjustmentsLotsController,
    StockAdjustmentsLinesController,
    StockAdjustmentsLineItemsController,
  ],
  providers: [
    StockAdjustmentsRootService,
    StockAdjustmentsLineItemsTransactionService,
  ],
})
export class StockAdjustmentsModule {}
