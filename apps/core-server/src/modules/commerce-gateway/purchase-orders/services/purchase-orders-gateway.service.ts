import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService } from '@vritti/api-sdk';
import type { CreatePurchaseOrderDto } from '../dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderDto } from '../dto/request/update-purchase-order.dto';
import type { PurchaseOrderResponseDto } from '../dto/response/purchase-order-response.dto';
import type { PurchaseOrderTableResponseDto } from '../dto/response/purchase-order-table-response.dto';

@Injectable()
export class PurchaseOrdersGatewayService {
  private readonly logger = new Logger(PurchaseOrdersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated purchase orders for the data table
  async findForTable(userId: string): Promise<PurchaseOrderTableResponseDto> {
    this.logger.log('purchaseOrders.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-purchase-orders');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: PurchaseOrderResponseDto[]; count: number }>(
      'commerce',
      'purchaseOrders.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new purchase order
  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.nats.send('commerce', 'purchaseOrders.create', dto);
  }

  // Finds a purchase order by ID
  async findById(id: string): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`purchaseOrders.findById — id: ${id}`);
    return this.nats.send('commerce', 'purchaseOrders.findById', { id });
  }

  // Updates a purchase order by ID
  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    this.logger.log(`purchaseOrders.update — id: ${id}`);
    return this.nats.send('commerce', 'purchaseOrders.update', { id, ...dto });
  }

  // Updates a purchase order status
  async updateStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${id}, status: ${status}`);
    return this.nats.send('commerce', 'purchaseOrders.updateStatus', { id, status });
  }

  // Deletes a purchase order by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`purchaseOrders.delete — id: ${id}`);
    return this.nats.send('commerce', 'purchaseOrders.delete', { id });
  }
}
