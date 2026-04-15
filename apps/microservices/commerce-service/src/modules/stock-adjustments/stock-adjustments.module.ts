import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { StockAdjustmentLineItemsDomainModule } from '@domain/stock-adjustment-line-items/stock-adjustment-line-items.module';
import { StockAdjustmentLinesDomainModule } from '@domain/stock-adjustment-lines/stock-adjustment-lines.module';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentsLineItemsTransactionService } from './line-items/services/stock-adjustments-line-items-transaction.service';
import { StockAdjustmentsLineItemsController } from './line-items/stock-adjustments-line-items.controller';
import { StockAdjustmentLinesTransactionService } from './lines/services/stock-adjustment-lines-transaction.service';
import { StockAdjustmentsLinesController } from './lines/stock-adjustments-lines.controller';
import { StockAdjustmentsRootService } from './root/services/stock-adjustments-root.service';
import { StockAdjustmentsRootController } from './root/stock-adjustments-root.controller';

@Module({
  imports: [
    StockAdjustmentsDomainModule,
    StockAdjustmentLinesDomainModule,
    StockAdjustmentLineItemsDomainModule,
    InventoryItemBatchesDomainModule,
    InventoryLedgerDomainModule,
  ],
  controllers: [StockAdjustmentsRootController, StockAdjustmentsLinesController, StockAdjustmentsLineItemsController],
  providers: [
    StockAdjustmentsRootService,
    StockAdjustmentLinesTransactionService,
    StockAdjustmentsLineItemsTransactionService,
  ],
})
export class StockAdjustmentsModule {}
