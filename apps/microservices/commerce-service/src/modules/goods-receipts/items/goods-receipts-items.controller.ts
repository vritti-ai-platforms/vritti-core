import type { GoodsReceiptItemDto } from '@domain/goods-receipts/dto/entity/goods-receipt-item.dto';
import type { GoodsReceiptItemsCostDto } from '@domain/goods-receipts/dto/entity/goods-receipt-items-cost.dto';
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

  @MessagePattern({ cmd: 'goodsReceipts.itemById' })
  itemById(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemDto> {
    this.logger.log(`goodsReceipts.itemById — item: ${data.itemId}`);
    return this.itemsService.findById(data.goodsReceiptId, data.itemId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.inventoryItemIds' })
  inventoryItemIds(@Payload() data: { goodsReceiptId: string }): Promise<string[]> {
    this.logger.log('goodsReceipts.inventoryItemIds');
    return this.itemsService.findInventoryItemIds(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.itemsTable' })
  itemsTable(
    @Payload() data: { goodsReceiptId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    this.logger.log('goodsReceipts.itemsTable');
    return this.itemsService.findForTable(data.goodsReceiptId, data);
  }

  @MessagePattern({ cmd: 'goodsReceipts.itemsCost' })
  itemsCost(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptItemsCostDto> {
    this.logger.log(`goodsReceipts.itemsCost — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findItemsCost(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.addItemFromSupplierItem' })
  addItemFromSupplierItem(
    @Payload()
    data: {
      goodsReceiptId: string;
      supplierItemId: string;
      quantity: number;
      rejectedQuantity?: number;
      // bigint over NATS is serialized as string by the gateway to dodge JSON precision loss.
      unitPrice?: string;
      currencyCode?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    this.logger.log(`goodsReceipts.addItemFromSupplierItem — supplierItem: ${data.supplierItemId}`);
    return this.itemsService.addItemFromSupplierItem(data.goodsReceiptId, {
      supplierItemId: data.supplierItemId,
      quantity: data.quantity,
      rejectedQuantity: data.rejectedQuantity,
      unitPrice: data.unitPrice !== undefined ? BigInt(data.unitPrice) : undefined,
      currencyCode: data.currencyCode,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.addItemFromPurchaseOrderItem' })
  addItemFromPurchaseOrderItem(
    @Payload()
    data: {
      goodsReceiptId: string;
      purchaseOrderItemId: string;
      quantity: number;
      rejectedQuantity?: number;
      unitPrice?: string;
      currencyCode?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    this.logger.log(`goodsReceipts.addItemFromPurchaseOrderItem — poItem: ${data.purchaseOrderItemId}`);
    return this.itemsService.addItemFromPurchaseOrderItem(data.goodsReceiptId, {
      purchaseOrderItemId: data.purchaseOrderItemId,
      quantity: data.quantity,
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
      quantity?: number;
      rejectedQuantity?: number;
      unitPrice?: string;
      currencyCode?: string;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.updateItem');
    return this.itemsService.updateItem(data.goodsReceiptId, data.itemId, {
      quantity: data.quantity,
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
