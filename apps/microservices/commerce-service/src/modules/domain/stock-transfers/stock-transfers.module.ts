import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { Module } from '@nestjs/common';
import { StockTransfersRepository } from './repositories/stock-transfers.repository';
import { StockTransfersService } from './services/stock-transfers.service';

@Module({
  imports: [InventoryItemQuantsDomainModule],
  providers: [StockTransfersService, StockTransfersRepository],
  exports: [StockTransfersService, StockTransfersRepository],
})
export class StockTransfersDomainModule {}
