import type { PurchaseOrderItemDto } from '@domain/purchase-order-items/dto/entity/purchase-order-item.dto';
import { AddPurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/add-purchase-order-item.dto';
import { UpdatePurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/update-purchase-order-item.dto';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { PurchaseOrdersItemsService } from './services/purchase-orders-items.service';

@Controller()
export class PurchaseOrdersItemsController {
  private readonly logger = new Logger(PurchaseOrdersItemsController.name);

  constructor(
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly service: PurchaseOrdersItemsService,
  ) {}

  // Returns every line of a purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.items' })
  items(@Payload() data: { id: string }): Promise<PurchaseOrderItemDto[]> {
    this.logger.log(`site.purchaseOrders.items — id: ${data.id}`);
    return this.itemsService.findByPurchaseOrderId(data.id);
  }

  // Returns the inventory items ordered on a purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.itemIds' })
  itemIds(@Payload() data: { id: string }): Promise<string[]> {
    this.logger.log(`site.purchaseOrders.itemIds — id: ${data.id}`);
    return this.itemsService.findInventoryItemIds(data.id);
  }

  // Returns one page of a purchase order's lines
  @MessagePattern({ cmd: 'site.purchaseOrders.itemsTable' })
  itemsTable(@Payload() data: { id: string } & TableState): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    this.logger.log(`site.purchaseOrders.itemsTable — id: ${data.id}`);
    const { id, ...state } = data;
    return this.itemsService.findForTable(id, state);
  }

  // Adds a line to a purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.addItem' })
  addItem(@Payload() dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    this.logger.log(`site.purchaseOrders.addItem — id: ${dto.purchaseOrderId}, supplierItem: ${dto.supplierItemId}`);
    return this.service.addItem(dto);
  }

  // Updates a line of a purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.updateItem' })
  updateItem(@Payload() dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.updateItem — id: ${dto.purchaseOrderId}, item: ${dto.itemId}`);
    return this.service.updateItem(dto);
  }

  // Removes a line from a purchase order
  @MessagePattern({ cmd: 'site.purchaseOrders.removeItem' })
  removeItem(@Payload() data: { id: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.purchaseOrders.removeItem — id: ${data.id}, item: ${data.itemId}`);
    return this.service.removeItem(data.id, data.itemId);
  }
}
