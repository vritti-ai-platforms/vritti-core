import type { OrderDetailDto, OrderDto } from '@domain/orders/dto/entity/order.dto';
import { OrdersService } from '@domain/orders/services/orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition } from '@vritti/api-sdk';
import type { CreateOrderDto } from './dto/request/create-order.dto';
import type { UpdateOrderStatusDto } from './dto/request/update-order-status.dto';

@Controller()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly service: OrdersService) {}

  @MessagePattern({ cmd: 'orders.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: OrderDto[]; count: number }> {
    this.logger.log('orders.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  @MessagePattern({ cmd: 'orders.create' })
  async create(@Payload() dto: CreateOrderDto): Promise<OrderDto> {
    this.logger.log(`orders.create — type: ${dto.type}, channel: ${dto.channel}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'orders.findById' })
  async findById(@Payload() data: { id: string }): Promise<OrderDetailDto> {
    this.logger.log(`orders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'orders.updateStatus' })
  async updateStatus(@Payload() data: { id: string } & UpdateOrderStatusDto): Promise<OrderDto> {
    const { id, ...statusData } = data;
    this.logger.log(`orders.updateStatus — id: ${id}, status: ${statusData.status}`);
    return this.service.updateStatus(id, statusData);
  }
}
