import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { StockTransfersDomainModule } from '@domain/stock-transfers/stock-transfers.module';
import { Module } from '@nestjs/common';
import { StockTransfersRootService } from './services/stock-transfers-root.service';
import { StockTransfersController } from './stock-transfers.controller';

@Module({
  imports: [StockTransfersDomainModule, InventoryItemQuantsDomainModule, InventoryItemLotsDomainModule],
  controllers: [StockTransfersController],
  providers: [StockTransfersRootService],
})
export class StockTransfersModule {}
