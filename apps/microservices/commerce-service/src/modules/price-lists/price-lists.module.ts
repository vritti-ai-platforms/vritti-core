import { PriceListsDomainModule } from '@domain/price-lists/price-lists.module';
import { Module } from '@nestjs/common';
import { PriceListsController } from './price-lists.controller';

@Module({
  imports: [PriceListsDomainModule],
  controllers: [PriceListsController],
})
export class PriceListsModule {}
