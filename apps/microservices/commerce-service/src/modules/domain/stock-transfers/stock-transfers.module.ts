import { Module } from '@nestjs/common';
import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { StockTransfersRepository } from './repositories/stock-transfers.repository';
import { StockTransfersService } from './services/stock-transfers.service';

@Module({
  imports: [InventoryItemBatchesDomainModule],
  providers: [StockTransfersService, StockTransfersRepository],
  exports: [StockTransfersService, StockTransfersRepository],
})
export class StockTransfersDomainModule {}
