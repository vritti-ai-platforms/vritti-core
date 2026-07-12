import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateOrderDto } from '../dto/request/create-order.dto';
import type { UpdateOrderStatusDto } from '../dto/request/update-order-status.dto';
import type { OrderDetailResponseDto, OrderResponseDto } from '../dto/response/order-response.dto';
import type { OrderTableResponseDto } from '../dto/response/order-table-response.dto';

@Injectable()
export class OrdersGatewayService {
  private readonly logger = new Logger(OrdersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted orders for the data table
  async findForTable(userId: string): Promise<OrderTableResponseDto> {
    this.logger.log('site.orders.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-orders');

    const { result, count } = await this.nats.send<{ result: OrderResponseDto[]; count: number }>(
      'commerce',
      'site.orders.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new order
  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    this.logger.log(`orders.create — type: ${dto.type}, channel: ${dto.channel}`);
    return this.nats.send('commerce', 'site.orders.create', dto);
  }

  // Finds an order by ID with full detail
  async findById(id: string): Promise<OrderDetailResponseDto> {
    this.logger.log(`orders.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.orders.findById', { id });
  }

  // Updates order status
  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    this.logger.log(`orders.updateStatus — id: ${id}, status: ${dto.status}`);
    return this.nats.send('commerce', 'site.orders.updateStatus', { id, ...dto });
  }
}
