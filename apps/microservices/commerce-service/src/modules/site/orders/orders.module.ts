import { OrdersDomainModule } from '@domain/orders/orders.module';
import { Module } from '@nestjs/common';
import { OrdersRootController } from './root/orders-root.controller';

@Module({
  imports: [OrdersDomainModule],
  controllers: [OrdersRootController],
})
export class SiteOrdersModule {}
