import type { GoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/entity/goods-receipt-lot.dto';
import type { AddGoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/request/add-goods-receipt-lot.dto';
import type { UpdateGoodsReceiptLotDto } from '@domain/goods-receipt-lots/dto/request/update-goods-receipt-lot.dto';
import { GoodsReceiptLotsDomainService } from '@domain/goods-receipt-lots/services/goods-receipt-lots.service';
import type { GoodsReceiptItemContext } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class GoodsReceiptsLotsService {
  constructor(
    private readonly lotsService: GoodsReceiptLotsDomainService,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly purchasesService: PurchasesDomainService,
  ) {}

  // Adds a lot to an item of a draft receipt
  async addLot(dto: AddGoodsReceiptLotDto, leCurrencyCode: string): Promise<CreateResponseDto<GoodsReceiptLotDto>> {
    const item = await this.itemsService.findDraftContextOrThrow(dto.goodsReceiptId, dto.itemId);
    this.assertNotReceiveWithInvoice(item);
    return this.lotsService.addLot(item, dto, leCurrencyCode);
  }

  // Changes a lot of an item of a draft receipt
  async updateLot(dto: UpdateGoodsReceiptLotDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const item = await this.itemsService.findDraftContextOrThrow(dto.goodsReceiptId, dto.itemId);
    this.assertNotReceiveWithInvoice(item);
    return this.lotsService.updateLot(item, dto, leCurrencyCode);
  }

  // Removes a lot from an item of a draft receipt
  async removeLot(goodsReceiptId: string, itemId: string, lotId: string): Promise<SuccessResponseDto> {
    const item = await this.itemsService.findDraftContextOrThrow(goodsReceiptId, itemId);
    this.assertNotReceiveWithInvoice(item);
    return this.lotsService.removeLot(item, lotId);
  }

  // Rejects a change to an item of a Receive with Invoice receipt, which is edited with its supplier invoice (409)
  private assertNotReceiveWithInvoice(item: GoodsReceiptItemContext): void {
    if (item.deliverySource !== InboundDeliverySourceValues.SUPPLIER_INVOICE) return;
    this.purchasesService.assertNotPartOfPurchase('This goods receipt', [item.purchaseNumber]);
  }
}
