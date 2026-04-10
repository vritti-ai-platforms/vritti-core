import { Module } from '@nestjs/common';
import { StockTransfersRepository } from './repositories/stock-transfers.repository';
import { StockTransfersService } from './services/stock-transfers.service';

@Module({
  providers: [StockTransfersService, StockTransfersRepository],
  exports: [StockTransfersService, StockTransfersRepository],
})
export class StockTransfersDomainModule {}
