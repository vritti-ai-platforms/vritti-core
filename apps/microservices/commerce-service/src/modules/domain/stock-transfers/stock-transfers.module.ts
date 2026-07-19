import { Module } from '@nestjs/common';
import { StockTransfersDomainRepository } from './repositories/stock-transfers.repository';
import { StockTransfersDomainService } from './services/stock-transfers.service';

@Module({
  providers: [StockTransfersDomainService, StockTransfersDomainRepository],
  exports: [StockTransfersDomainService, StockTransfersDomainRepository],
})
export class StockTransfersDomainModule {}
