import type { GoodsReceiptItemDto } from '@domain/goods-receipts/dto/entity/goods-receipt-item.dto';
import type { GoodsReceiptItemsCostDto } from '@domain/goods-receipts/dto/entity/goods-receipt-items-cost.dto';
import type { GoodsReceiptTreeNode } from '@domain/goods-receipts/dto/entity/goods-receipt-tree.dto';
import { UpdateGoodsReceiptItemDto } from '@domain/goods-receipts/dto/request/update-goods-receipt-item.dto';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import type { GoodsReceiptItemQuantsDto } from '@domain/inventory-item-quants/dto/entity/goods-receipt-item-quants.dto';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsItemsService } from './services/goods-receipts-items.service';

@Controller()
export class GoodsReceiptsItemsController {
  private readonly logger = new Logger(GoodsReceiptsItemsController.name);

  constructor(
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
    private readonly service: GoodsReceiptsItemsService,
  ) {}

  // Returns a goods receipt's items with their lots and lines as a tree
  @MessagePattern({ cmd: 'site.goodsReceipts.tree' })
  tree(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptTreeNode[]> {
    this.logger.log(`site.goodsReceipts.tree — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findTree(data.goodsReceiptId);
  }

  // Returns one item of a goods receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.itemById' })
  itemById(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemDto> {
    this.logger.log(`site.goodsReceipts.itemById — item: ${data.itemId}`);
    return this.itemsService.findById(data.goodsReceiptId, data.itemId);
  }

  // Returns the inventory items counted on a goods receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.inventoryItemIds' })
  inventoryItemIds(@Payload() data: { goodsReceiptId: string }): Promise<string[]> {
    this.logger.log(`site.goodsReceipts.inventoryItemIds — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findInventoryItemIds(data.goodsReceiptId);
  }

  // Returns one page of a goods receipt's items
  @MessagePattern({ cmd: 'site.goodsReceipts.itemsTable' })
  itemsTable(
    @Payload() data: { goodsReceiptId: string } & TableState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    this.logger.log(`site.goodsReceipts.itemsTable — receipt: ${data.goodsReceiptId}`);
    const { goodsReceiptId, ...state } = data;
    return this.itemsService.findForTable(goodsReceiptId, state);
  }

  // Returns the provisional cost of a goods receipt's items in the legal entity's currency
  @MessagePattern({ cmd: 'site.goodsReceipts.itemsCost' })
  itemsCost(
    @Payload() data: { goodsReceiptId: string },
    @RpcSiteCurrencyCode() leCurrencyCode: string,
  ): Promise<GoodsReceiptItemsCostDto> {
    this.logger.log(`site.goodsReceipts.itemsCost — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findItemsCost(data.goodsReceiptId, leCurrencyCode);
  }

  // Returns the quants a published goods receipt item landed in, with their cost
  @MessagePattern({ cmd: 'site.goodsReceipts.itemQuants' })
  itemQuants(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemQuantsDto> {
    this.logger.log(`site.goodsReceipts.itemQuants — item: ${data.itemId}`);
    return this.quantsService.findCostsByGrItemId(data.itemId);
  }

  // Changes the received or rejected quantity of a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.updateItem' })
  updateItem(@Payload() dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.updateItem — item: ${dto.itemId}`);
    return this.service.updateItem(dto);
  }

  // Removes an item from a goods receipt
  @MessagePattern({ cmd: 'site.goodsReceipts.removeItem' })
  removeItem(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeItem — item: ${data.itemId}`);
    return this.service.removeItem(data.goodsReceiptId, data.itemId);
  }
}
