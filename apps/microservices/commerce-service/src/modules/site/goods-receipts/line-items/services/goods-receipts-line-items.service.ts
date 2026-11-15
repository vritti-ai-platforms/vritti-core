import type { GoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/entity/goods-receipt-line-item.dto';
import type { AddGoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/request/add-goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsDomainService } from '@domain/goods-receipt-line-items/services/goods-receipt-line-items.service';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import type { GoodsReceiptItemContext } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class GoodsReceiptsLineItemsService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly lineItemsService: GoodsReceiptLineItemsDomainService,
    private readonly linesService: GoodsReceiptLinesDomainService,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly purchasesService: PurchasesDomainService,
  ) {}

  // Registers a serial on a line of a draft receipt and re-checks whether the line's serials are complete
  async addLineItem(dto: AddGoodsReceiptLineItemDto): Promise<CreateResponseDto<GoodsReceiptLineItemDto>> {
    const item = await this.itemsService.findDraftContextOrThrow(dto.goodsReceiptId, dto.itemId);
    this.assertNotReceiveWithInvoice(item);
    const line = await this.linesService.findOnItemOrThrow(item.id, dto.lineId);
    return this.database.runInTransaction(async () => {
      const created = await this.lineItemsService.addLineItem(item, line, dto);
      await this.linesService.refreshIsBalanced(line.id, item.tracking);
      return created;
    });
  }

  // Removes a serial from a line of a draft receipt and re-checks whether the line's serials are complete
  async removeLineItem(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    lineItemId: string,
  ): Promise<SuccessResponseDto> {
    const item = await this.itemsService.findDraftContextOrThrow(goodsReceiptId, itemId);
    this.assertNotReceiveWithInvoice(item);
    const line = await this.linesService.findOnItemOrThrow(item.id, lineId);
    return this.database.runInTransaction(async () => {
      const removed = await this.lineItemsService.removeLineItem(line, lineItemId);
      await this.linesService.refreshIsBalanced(line.id, item.tracking);
      return removed;
    });
  }

  // Rejects a change to an item of a Receive with Invoice receipt, which is edited with its supplier invoice (409)
  private assertNotReceiveWithInvoice(item: GoodsReceiptItemContext): void {
    if (item.deliverySource !== InboundDeliverySourceValues.SUPPLIER_INVOICE) return;
    this.purchasesService.assertNotPartOfPurchase('This goods receipt', [item.purchaseNumber]);
  }
}
