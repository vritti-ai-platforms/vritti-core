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
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsItemsService } from '@/modules/site/goods-receipts/items/services/goods-receipts-items.service';

@Controller()
export class LeGoodsReceiptsItemsController {
  private readonly logger = new Logger(LeGoodsReceiptsItemsController.name);

  constructor(
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly quantsService: InventoryItemQuantsDomainService,
    private readonly service: GoodsReceiptsItemsService,
  ) {}

  // Returns a goods receipt's items with their lots and lines as a tree
  @MessagePattern({ cmd: 'le.goodsReceipts.tree' })
  tree(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptTreeNode[]> {
    this.logger.log(`le.goodsReceipts.tree — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findTree(data.goodsReceiptId);
  }

  // Returns one item of a goods receipt
  @MessagePattern({ cmd: 'le.goodsReceipts.itemById' })
  itemById(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemDto> {
    this.logger.log(`le.goodsReceipts.itemById — item: ${data.itemId}`);
    return this.itemsService.findById(data.goodsReceiptId, data.itemId);
  }

  // Returns the inventory items counted on a goods receipt
  @MessagePattern({ cmd: 'le.goodsReceipts.inventoryItemIds' })
  inventoryItemIds(@Payload() data: { goodsReceiptId: string }): Promise<string[]> {
    this.logger.log(`le.goodsReceipts.inventoryItemIds — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findInventoryItemIds(data.goodsReceiptId);
  }

  // Returns one page of a goods receipt's items
  @MessagePattern({ cmd: 'le.goodsReceipts.itemsTable' })
  itemsTable(
    @Payload() data: { goodsReceiptId: string } & TableState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    this.logger.log(`le.goodsReceipts.itemsTable — receipt: ${data.goodsReceiptId}`);
    const { goodsReceiptId, ...state } = data;
    return this.itemsService.findForTable(goodsReceiptId, state);
  }

  // Returns the provisional cost of a goods receipt's items in the legal entity's currency
  @MessagePattern({ cmd: 'le.goodsReceipts.itemsCost' })
  itemsCost(@Payload() data: { goodsReceiptId: string; leCurrencyCode: string }): Promise<GoodsReceiptItemsCostDto> {
    this.logger.log(`le.goodsReceipts.itemsCost — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findItemsCost(data.goodsReceiptId, data.leCurrencyCode);
  }

  // Returns the quants a published goods receipt item landed in, with their cost
  @MessagePattern({ cmd: 'le.goodsReceipts.itemQuants' })
  itemQuants(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemQuantsDto> {
    this.logger.log(`le.goodsReceipts.itemQuants — item: ${data.itemId}`);
    return this.quantsService.findCostsByGrItemId(data.itemId);
  }

  // Changes the received or rejected quantity of a goods receipt item
  @MessagePattern({ cmd: 'le.goodsReceipts.updateItem' })
  updateItem(@Payload() dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.updateItem — item: ${dto.itemId}`);
    return this.service.updateItem(dto);
  }

  // Removes an item from a goods receipt
  @MessagePattern({ cmd: 'le.goodsReceipts.removeItem' })
  removeItem(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeItem — item: ${data.itemId}`);
    return this.service.removeItem(data.goodsReceiptId, data.itemId);
  }
}
