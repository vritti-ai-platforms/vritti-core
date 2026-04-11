import { Module } from '@nestjs/common';
import { InventoryLevelsDomainModule } from '@domain/inventory-levels/inventory-levels.module';
import { StockTransfersRepository } from './repositories/stock-transfers.repository';
import { StockTransfersService } from './services/stock-transfers.service';

@Module({
  imports: [InventoryLevelsDomainModule],
  providers: [StockTransfersService, StockTransfersRepository],
  exports: [StockTransfersService, StockTransfersRepository],
})
export class StockTransfersDomainModule {}
