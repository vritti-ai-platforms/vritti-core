import type { OrderDetailDto, OrderDto } from '@domain/orders/dto/entity/order.dto';
import { CreateOrderDto } from '@domain/orders/dto/request/create-order.dto';
import { UpdateOrderStatusDto } from '@domain/orders/dto/request/update-order-status.dto';
import { OrdersDomainService } from '@domain/orders/services/orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly service: OrdersDomainService) {}

  @MessagePattern({ cmd: 'site.orders.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: OrderDto[]; count: number }> {
    this.logger.log('orders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'site.orders.create' })
  async create(@Payload() dto: CreateOrderDto): Promise<OrderDto> {
    this.logger.log(`orders.create — type: ${dto.type}, channel: ${dto.channel}, channelId: ${dto.channelId ?? '-'}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'site.orders.findById' })
  async findById(@Payload() data: { id: string }): Promise<OrderDetailDto> {
    this.logger.log(`orders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.orders.updateStatus' })
  async updateStatus(@Payload() dto: UpdateOrderStatusDto): Promise<OrderDto> {
    const { id, ...statusData } = dto;
    this.logger.log(`orders.updateStatus — id: ${id}, status: ${statusData.status}`);
    return this.service.updateStatus(id, statusData);
  }
}
