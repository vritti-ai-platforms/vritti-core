import type { UpdateGoodsReceiptItemDto } from '@domain/goods-receipts/dto/request/update-goods-receipt-item.dto';
import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { Injectable } from '@nestjs/common';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class GoodsReceiptsItemsService {
  constructor(
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly purchasesRepository: PurchasesDomainRepository,
  ) {}

  // Changes an item's quantities on a draft receipt
  async updateItem(dto: UpdateGoodsReceiptItemDto): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(dto.goodsReceiptId, 'Cannot Edit Item');
    this.assertNotReceiveWithInvoice(receipt);
    const item = await this.itemsService.findOnReceiptOrThrow(receipt.id, dto.itemId);
    return this.itemsService.updateItem(receipt, item, dto);
  }

  // Removes an item from a draft receipt
  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    const receipt = await this.goodsReceiptsService.findDraftOrThrow(goodsReceiptId, 'Cannot Remove Item');
    this.assertNotReceiveWithInvoice(receipt);
    const item = await this.itemsService.findOnReceiptOrThrow(receipt.id, itemId);
    return this.itemsService.removeItem(receipt, item);
  }

  // Rejects a change to a Receive with Invoice receipt, which is edited with its supplier invoice (409)
  private assertNotReceiveWithInvoice(receipt: GoodsReceiptRow): void {
    if (receipt.deliverySource !== InboundDeliverySourceValues.SUPPLIER_INVOICE) return;
    this.purchasesRepository.assertNotPartOfPurchase(`Goods receipt "${receipt.grNumber}"`, [receipt.purchaseNumber]);
  }
}
