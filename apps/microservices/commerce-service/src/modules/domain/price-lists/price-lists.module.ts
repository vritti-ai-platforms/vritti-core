import { PosTerminalsDomainModule } from '@domain/pos-terminals/pos-terminals.module';
import { Module } from '@nestjs/common';
import { PriceListsRepository } from './repositories/price-lists.repository';
import { PriceListsService } from './services/price-lists.service';

@Module({
  imports: [PosTerminalsDomainModule],
  providers: [PriceListsService, PriceListsRepository],
  exports: [PriceListsService, PriceListsRepository],
})
export class PriceListsDomainModule {}
