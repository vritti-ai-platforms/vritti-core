import { PosTerminalsDomainModule } from '@domain/pos-terminals/pos-terminals.module';
import { PriceListsDomainModule } from '@domain/price-lists/price-lists.module';
import { Module } from '@nestjs/common';
import { PriceListsController } from './price-lists.controller';

@Module({
  imports: [PriceListsDomainModule, PosTerminalsDomainModule],
  controllers: [PriceListsController],
})
export class PriceListsModule {}
