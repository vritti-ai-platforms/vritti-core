import { Module } from '@nestjs/common';
import { OrdersRepository } from './repositories/orders.repository';
import { OrdersService } from './services/orders.service';

@Module({
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersDomainModule {}
