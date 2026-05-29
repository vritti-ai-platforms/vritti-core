import type { GoodsReceiptItemDto } from '@domain/goods-receipts/dto/entity/goods-receipt-item.dto';
import type { GoodsReceiptTreeNode } from '@domain/goods-receipts/dto/entity/goods-receipt-tree.dto';
import { GoodsReceiptItemsService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';

@Controller()
export class GoodsReceiptsItemsController {
  private readonly logger = new Logger(GoodsReceiptsItemsController.name);

  constructor(private readonly itemsService: GoodsReceiptItemsService) {}

  @MessagePattern({ cmd: 'goodsReceipts.tree' })
  tree(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptTreeNode[]> {
    this.logger.log(`goodsReceipts.tree — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findTreeForReceipt(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.inventoryItemIds' })
  inventoryItemIds(@Payload() data: { goodsReceiptId: string }): Promise<string[]> {
    this.logger.log('goodsReceipts.inventoryItemIds');
    return this.itemsService.findInventoryItemIds(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.items' })
  items(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptItemDto[]> {
    this.logger.log('goodsReceipts.items');
    return this.itemsService.findByGoodsReceiptId(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.itemsTable' })
  itemsTable(
    @Payload() data: { goodsReceiptId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    this.logger.log('goodsReceipts.itemsTable');
    return this.itemsService.findForTable(data.goodsReceiptId, data);
  }

  @MessagePattern({ cmd: 'goodsReceipts.itemById' })
  itemById(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemDto> {
    this.logger.log('goodsReceipts.itemById');
    return this.itemsService.findById(data.goodsReceiptId, data.itemId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.addItem' })
  addItem(
    @Payload()
    data: {
      goodsReceiptId: string;
      supplierItemId: string;
      rejectedQuantity?: number;
      // bigint over NATS is serialized as string by the gateway to dodge JSON precision loss.
      unitPrice?: string;
      currencyCode?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    this.logger.log(`goodsReceipts.addItem — supplierItem: ${data.supplierItemId}`);
    return this.itemsService.addItem(data.goodsReceiptId, {
      supplierItemId: data.supplierItemId,
      rejectedQuantity: data.rejectedQuantity,
      unitPrice: data.unitPrice !== undefined ? BigInt(data.unitPrice) : undefined,
      currencyCode: data.currencyCode,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.updateItem' })
  updateItem(
    @Payload()
    data: {
      goodsReceiptId: string;
      itemId: string;
      rejectedQuantity?: number;
      unitPrice?: string;
      currencyCode?: string;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.updateItem');
    return this.itemsService.updateItem(data.goodsReceiptId, data.itemId, {
      rejectedQuantity: data.rejectedQuantity,
      unitPrice: data.unitPrice !== undefined ? BigInt(data.unitPrice) : undefined,
      currencyCode: data.currencyCode,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.removeItem' })
  removeItem(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.removeItem');
    return this.itemsService.removeItem(data.goodsReceiptId, data.itemId);
  }
}
