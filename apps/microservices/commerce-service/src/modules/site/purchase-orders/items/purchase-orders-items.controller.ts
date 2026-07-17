import type { PurchaseOrderItemDto } from '@domain/purchase-order-items/dto/entity/purchase-order-item.dto';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddPurchaseOrderItemDto } from '../root/dto/request/add-purchase-order-item.dto';
import { UpdatePurchaseOrderItemDto } from '../root/dto/request/update-purchase-order-item.dto';
import { PurchaseOrdersItemsService } from './services/purchase-orders-items.service';

@Controller()
export class PurchaseOrdersItemsController {
  private readonly logger = new Logger(PurchaseOrdersItemsController.name);

  constructor(private readonly service: PurchaseOrdersItemsService) {}

  @MessagePattern({ cmd: 'site.purchaseOrders.items' })
  items(@Payload() data: { id: string }): Promise<PurchaseOrderItemDto[]> {
    this.logger.log(`purchaseOrders.items — id: ${data.id}`);
    return this.service.findItems(data.id);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.itemIds' })
  itemIds(@Payload() data: { id: string }): Promise<string[]> {
    this.logger.log(`purchaseOrders.itemIds — id: ${data.id}`);
    return this.service.findItemIds(data.id);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.itemsTable' })
  itemsTable(
    @Payload() data: { id: string } & TableViewState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    this.logger.log(`purchaseOrders.itemsTable — id: ${data.id}`);
    const { id, ...state } = data;
    return this.service.findItemsForTable(id, state);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.addItem' })
  addItem(@Payload() dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`purchaseOrders.addItem — id: ${dto.id}, supplierItemId: ${dto.supplierItemId}`);
    return this.service.addItem(dto.id, dto);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.updateItem' })
  updateItem(@Payload() dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.updateItem — id: ${dto.id}, itemId: ${dto.itemId}`);
    return this.service.updateItem(dto.id, dto.itemId, dto);
  }

  @MessagePattern({ cmd: 'site.purchaseOrders.removeItem' })
  removeItem(@Payload() data: { id: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`purchaseOrders.removeItem — id: ${data.id}, itemId: ${data.itemId}`);
    return this.service.removeItem(data.id, data.itemId);
  }
}
