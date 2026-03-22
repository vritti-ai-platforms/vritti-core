import { Module } from '@nestjs/common';
import { KotController } from './kot/controllers/kot.controller';
import { KotService } from './kot/services/kot.service';
import { OrderController } from './order/controllers/order.controller';
import { OrderItemRepository } from './order/repositories/order-item.repository';
import { OrderRepository } from './order/repositories/order.repository';
import { OrderService } from './order/services/order.service';
import { StationController } from './station/controllers/station.controller';
import { StationRepository } from './station/repositories/station.repository';
import { StationService } from './station/services/station.service';

@Module({
  controllers: [OrderController, StationController, KotController],
  providers: [
    // Order
    OrderService,
    OrderRepository,
    OrderItemRepository,
    // Station
    StationService,
    StationRepository,
    // KOT
    KotService,
  ],
  exports: [OrderRepository, OrderItemRepository],
})
export class OrdersModule {}
