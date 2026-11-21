import type { OrderDetailDto, OrderDto } from '@domain/orders/dto/entity/order.dto';
import type { OrderCountsDto } from '@domain/orders/dto/entity/order-counts.dto';
import { CreateOrderDto } from '@domain/orders/dto/request/create-order.dto';
import { UpdateOrderStatusDto } from '@domain/orders/dto/request/update-order-status.dto';
import { OrdersDomainService } from '@domain/orders/services/orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';

@Controller()
export class OrdersRootController {
  private readonly logger = new Logger(OrdersRootController.name);

  constructor(private readonly service: OrdersDomainService) {}

  @MessagePattern({ cmd: 'site.orders.create' })
  async create(@Payload() dto: CreateOrderDto, @RpcLeCurrencyCode() currencyCode: string): Promise<OrderDto> {
    this.logger.log(`orders.create — type: ${dto.type}, channel: ${dto.channel}`);
    return this.service.create(dto, currencyCode);
  }

  @MessagePattern({ cmd: 'site.orders.updateStatus' })
  async updateStatus(@Payload() dto: UpdateOrderStatusDto): Promise<OrderDto> {
    const { id, ...statusData } = dto;
    this.logger.log(`orders.updateStatus — id: ${id}, status: ${statusData.status}`);
    return this.service.updateStatus(id, statusData);
  }

  @MessagePattern({ cmd: 'site.orders.findById' })
  async findById(@Payload() data: { id: string }): Promise<OrderDetailDto> {
    this.logger.log(`orders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.orders.table' })
  async table(@Payload() state: TableState): Promise<{ result: OrderDto[]; count: number }> {
    this.logger.log('orders.table');
    return this.service.findForTable(state);
  }

  // Counts an order's items, for its Items tab
  @MessagePattern({ cmd: 'site.orders.findCounts' })
  async findCounts(@Payload() data: { id: string }): Promise<OrderCountsDto> {
    this.logger.log(`orders.findCounts — id: ${data.id}`);
    return this.service.findCounts(data.id);
  }
}
