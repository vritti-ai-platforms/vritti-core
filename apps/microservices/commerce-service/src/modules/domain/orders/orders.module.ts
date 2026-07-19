import { Module } from '@nestjs/common';
import { OrdersDomainRepository } from './repositories/orders.repository';
import { OrdersDomainService } from './services/orders.service';

@Module({
  providers: [OrdersDomainService, OrdersDomainRepository],
  exports: [OrdersDomainService, OrdersDomainRepository],
})
export class OrdersDomainModule {}
