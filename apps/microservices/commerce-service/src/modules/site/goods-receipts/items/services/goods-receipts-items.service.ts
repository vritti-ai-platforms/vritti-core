import type { UpdateGoodsReceiptItemDto } from '@domain/goods-receipts/dto/request/update-goods-receipt-item.dto';
import { GoodsReceiptItemsDomainRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptsDomainRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class GoodsReceiptsItemsService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly goodsReceiptsRepository: GoodsReceiptsDomainRepository,
    private readonly goodsReceiptItemsRepository: GoodsReceiptItemsDomainRepository,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
  ) {}

  // Changes an item's quantities on a draft receipt and, when the receipt created its delivery, that delivery line's quantity with it, in one transaction
  async updateItem(dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsRepository.findDraftOrThrow(dto.goodsReceiptId, 'Cannot Edit Item');
    const item = await this.goodsReceiptItemsRepository.findOnReceiptOrThrow(receipt.id, dto.itemId);

    return this.database.runInTransaction(async () => {
      const result = await this.itemsService.updateItem(receipt, item, dto);
      if (receipt.deliverySource === InboundDeliverySourceValues.RECEIPT) {
        await this.deliveryLinesService.mirrorReceiptQuantity(
          receipt.inboundDeliveryId,
          item.purchaseOrderItemId,
          dto.receivedQty ?? item.receivedQty,
        );
      }
      return result;
    });
  }

  // Removes an item from a draft receipt and, when the receipt created its delivery, that delivery's line of it, in one transaction
  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsRepository.findDraftOrThrow(goodsReceiptId, 'Cannot Remove Item');
    const item = await this.goodsReceiptItemsRepository.findOnReceiptOrThrow(receipt.id, itemId);

    return this.database.runInTransaction(async () => {
      const result = await this.itemsService.removeItem(receipt, item);
      if (receipt.deliverySource === InboundDeliverySourceValues.RECEIPT) {
        await this.deliveryLinesService.mirrorReceiptRemoval(receipt.inboundDeliveryId, item.purchaseOrderItemId);
      }
      return result;
    });
  }
}
