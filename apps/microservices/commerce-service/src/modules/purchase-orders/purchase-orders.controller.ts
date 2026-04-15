import type { PurchaseOrderDetailDto, PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import { PurchaseOrderStatus } from '@/db/schema';
import type { CreatePurchaseOrderDto } from './dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderDto } from './dto/request/update-purchase-order.dto';

@Controller()
export class PurchaseOrdersController {
  private readonly logger = new Logger(PurchaseOrdersController.name);

  constructor(private readonly service: PurchaseOrdersService) {}

  @MessagePattern({ cmd: 'purchaseOrders.table' })
  async table(
    @Payload() state: TableViewState,
  ): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    this.logger.log('purchaseOrders.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'purchaseOrders.create' })
  async create(@Payload() dto: CreatePurchaseOrderDto): Promise<PurchaseOrderDetailDto> {
    this.logger.log(`purchaseOrders.create — supplier: ${dto.supplierId}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'purchaseOrders.findById' })
  async findById(@Payload() data: { id: string }): Promise<PurchaseOrderDetailDto> {
    this.logger.log(`purchaseOrders.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'purchaseOrders.update' })
  async update(@Payload() data: { id: string } & UpdatePurchaseOrderDto): Promise<PurchaseOrderDetailDto> {
    const { id, ...updateData } = data;
    this.logger.log(`purchaseOrders.update — id: ${id}`);
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'purchaseOrders.updateStatus' })
  async updateStatus(@Payload() data: { id: string; status: string }): Promise<PurchaseOrderDto> {
    this.logger.log(`purchaseOrders.updateStatus — id: ${data.id}, status: ${data.status}`);
    return this.service.updateStatus(data.id, data.status as PurchaseOrderStatus);
  }

  @MessagePattern({ cmd: 'purchaseOrders.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
