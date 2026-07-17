import type { GoodsReceiptItemDto } from '@domain/goods-receipts/dto/entity/goods-receipt-item.dto';
import type { GoodsReceiptItemsCostDto } from '@domain/goods-receipts/dto/entity/goods-receipt-items-cost.dto';
import type { GoodsReceiptTreeNode } from '@domain/goods-receipts/dto/entity/goods-receipt-tree.dto';
import { GoodsReceiptItemsService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import type { GoodsReceiptItemQuantsDto } from '@domain/inventory-item-quants/dto/entity/goods-receipt-item-quants.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { RpcSiteCurrencyCode } from '@vritti/api-sdk/nats';
import { AddGoodsReceiptItemFromPurchaseOrderItemDto } from './dto/request/add-goods-receipt-item-from-purchase-order-item.dto';
import { AddGoodsReceiptItemFromSupplierItemDto } from './dto/request/add-goods-receipt-item-from-supplier-item.dto';
import { UpdateGoodsReceiptItemDto } from './dto/request/update-goods-receipt-item.dto';

@Controller()
export class GoodsReceiptsItemsController {
  private readonly logger = new Logger(GoodsReceiptsItemsController.name);

  constructor(
    private readonly itemsService: GoodsReceiptItemsService,
    private readonly quantsService: InventoryItemQuantsService,
  ) {}

  @MessagePattern({ cmd: 'site.goodsReceipts.tree' })
  tree(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptTreeNode[]> {
    this.logger.log(`goodsReceipts.tree — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findTreeForReceipt(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.itemById' })
  itemById(
    @Payload() data: { goodsReceiptId: string; itemId: string },
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<GoodsReceiptItemDto> {
    this.logger.log(`goodsReceipts.itemById — item: ${data.itemId}`);
    return this.itemsService.findById(data.goodsReceiptId, data.itemId, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.inventoryItemIds' })
  inventoryItemIds(@Payload() data: { goodsReceiptId: string }): Promise<string[]> {
    this.logger.log('goodsReceipts.inventoryItemIds');
    return this.itemsService.findInventoryItemIds(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.itemsTable' })
  itemsTable(
    @Payload() data: { goodsReceiptId: string } & TableViewState,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    this.logger.log('goodsReceipts.itemsTable');
    return this.itemsService.findForTable(data.goodsReceiptId, data, siteCurrencyCode);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.itemsCost' })
  itemsCost(@Payload() data: { goodsReceiptId: string }): Promise<GoodsReceiptItemsCostDto> {
    this.logger.log(`goodsReceipts.itemsCost — receipt: ${data.goodsReceiptId}`);
    return this.itemsService.findItemsCost(data.goodsReceiptId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.itemQuants' })
  itemQuants(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<GoodsReceiptItemQuantsDto> {
    this.logger.log(`goodsReceipts.itemQuants — item: ${data.itemId}`);
    return this.quantsService.findCostsByGrItemId(data.itemId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.addItemFromSupplierItem' })
  addItemFromSupplierItem(
    @Payload() data: AddGoodsReceiptItemFromSupplierItemDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    this.logger.log(`goodsReceipts.addItemFromSupplierItem — supplierItem: ${data.supplierItemId}`);
    return this.itemsService.addItemFromSupplierItem(
      data.goodsReceiptId,
      {
        supplierItemId: data.supplierItemId,
        orderedQty: data.orderedQty,
        rejectedQuantity: data.rejectedQuantity,
        unitPrice: data.unitPrice !== undefined ? BigInt(data.unitPrice) : undefined,
        currencyCode: data.currencyCode,
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      },
      siteCurrencyCode,
    );
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.addItemFromPurchaseOrderItem' })
  addItemFromPurchaseOrderItem(
    @Payload() data: AddGoodsReceiptItemFromPurchaseOrderItemDto,
    @RpcSiteCurrencyCode() siteCurrencyCode: string,
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    this.logger.log(`goodsReceipts.addItemFromPurchaseOrderItem — poItem: ${data.purchaseOrderItemId}`);
    return this.itemsService.addItemFromPurchaseOrderItem(
      data.goodsReceiptId,
      {
        purchaseOrderItemId: data.purchaseOrderItemId,
        orderedQty: data.orderedQty,
        rejectedQuantity: data.rejectedQuantity,
        unitPrice: data.unitPrice !== undefined ? BigInt(data.unitPrice) : undefined,
        currencyCode: data.currencyCode,
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      },
      siteCurrencyCode,
    );
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.updateItem' })
  updateItem(@Payload() data: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.updateItem');
    return this.itemsService.updateItem(data.goodsReceiptId, data.itemId, {
      orderedQty: data.orderedQty,
      rejectedQuantity: data.rejectedQuantity,
      unitPrice: data.unitPrice !== undefined ? BigInt(data.unitPrice) : undefined,
      currencyCode: data.currencyCode,
      schemeBuyQty: data.schemeBuyQty,
      schemeFreeQty: data.schemeFreeQty,
      hasScheme: data.hasScheme,
    });
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.removeItem' })
  removeItem(@Payload() data: { goodsReceiptId: string; itemId: string }): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.removeItem');
    return this.itemsService.removeItem(data.goodsReceiptId, data.itemId);
  }
}
