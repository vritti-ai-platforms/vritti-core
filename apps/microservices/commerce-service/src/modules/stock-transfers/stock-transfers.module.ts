import { StockTransfersDomainModule } from '@domain/stock-transfers/stock-transfers.module';
import { Module } from '@nestjs/common';
import { StockTransfersController } from './stock-transfers.controller';

@Module({
  imports: [StockTransfersDomainModule],
  controllers: [StockTransfersController],
})
export class StockTransfersModule {}
