import { OrdersDomainModule } from '@domain/orders/orders.module';
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';

@Module({
  imports: [OrdersDomainModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
