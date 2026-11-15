import type { GoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/entity/goods-receipt-line.dto';
import type { AddGoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/request/add-goods-receipt-line.dto';
import type { UpdateGoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/request/update-goods-receipt-line.dto';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import type { GoodsReceiptItemContext } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptItemsDomainService } from '@domain/goods-receipts/services/goods-receipt-items.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class GoodsReceiptsLinesService {
  constructor(
    private readonly linesService: GoodsReceiptLinesDomainService,
    private readonly itemsService: GoodsReceiptItemsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly purchasesService: PurchasesDomainService,
  ) {}

  // Adds a line to an item of a draft receipt, snapshotting its quantity in the item's primary unit
  async addLine(dto: AddGoodsReceiptLineDto): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    const item = await this.itemsService.findDraftContextOrThrow(dto.goodsReceiptId, dto.itemId);
    this.assertNotReceiveWithInvoice(item);
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      item.inventoryItemId,
      item.uomId,
      dto.quantity,
    );
    return this.linesService.addLine(item, dto, primaryUomQty);
  }

  // Changes a line of an item of a draft receipt, snapshotting a changed quantity in the item's primary unit
  async updateLine(dto: UpdateGoodsReceiptLineDto): Promise<SuccessResponseDto> {
    const item = await this.itemsService.findDraftContextOrThrow(dto.goodsReceiptId, dto.itemId);
    this.assertNotReceiveWithInvoice(item);
    const primaryUomQty =
      dto.quantity === undefined
        ? undefined
        : await this.uomConversionsService.toPrimaryUomQuantity(item.inventoryItemId, item.uomId, dto.quantity);
    return this.linesService.updateLine(item, dto, primaryUomQty);
  }

  // Removes a line from an item of a draft receipt
  async removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    const item = await this.itemsService.findDraftContextOrThrow(goodsReceiptId, itemId);
    this.assertNotReceiveWithInvoice(item);
    return this.linesService.removeLine(item, lineId);
  }

  // Rejects a change to an item of a Receive with Invoice receipt, which is edited with its supplier invoice (409)
  private assertNotReceiveWithInvoice(item: GoodsReceiptItemContext): void {
    if (item.deliverySource !== InboundDeliverySourceValues.SUPPLIER_INVOICE) return;
    this.purchasesService.assertNotPartOfPurchase('This goods receipt', [item.purchaseNumber]);
  }
}
