import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { OrderDto } from '../dto/entity/order.dto';
import type { AddOrderItemsDto } from '../dto/request/add-order-items.dto';
import type { CreateOrderDto } from '../dto/request/create-order.dto';
import { OrderService } from '../services/order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Lists orders for an org+bu with optional status/source filters
  @MessagePattern('commerce.orders.findAll')
  findAll(
    @Payload() data: { organizationId: string; businessUnitId: string; status?: string; source?: string },
  ): Promise<OrderDto[]> {
    return this.orderService.findAll(data.organizationId, data.businessUnitId, {
      status: data.status,
      source: data.source,
    });
  }

  // Returns a single order with items
  @MessagePattern('commerce.orders.findById')
  findById(@Payload() data: { id: string }): Promise<OrderDto> {
    return this.orderService.findById(data.id);
  }

  // Creates a new order with items
  @MessagePattern('commerce.orders.create')
  create(@Payload() dto: CreateOrderDto): Promise<OrderDto> {
    return this.orderService.create(dto);
  }

  // Updates the order status
  @MessagePattern('commerce.orders.updateStatus')
  updateStatus(@Payload() data: { id: string; status: string }): Promise<SuccessResponseDto> {
    return this.orderService.updateStatus(data.id, data.status);
  }

  // Adds items to an existing order
  @MessagePattern('commerce.orders.addItems')
  addItems(@Payload() dto: AddOrderItemsDto): Promise<SuccessResponseDto> {
    return this.orderService.addItems(dto);
  }

  // Updates a single order item's status
  @MessagePattern('commerce.orders.updateItemStatus')
  updateItemStatus(@Payload() data: { itemId: string; status: string }): Promise<SuccessResponseDto> {
    return this.orderService.updateItemStatus(data.itemId, data.status);
  }
}
