import type { GoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/entity/goods-receipt-line.dto';
import { GoodsReceiptLinesService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

// App-layer orchestrator for GR line writes: snapshots the primary-UOM quantity (cross-domain UOM
// conversion lives here, not in the domain service) before delegating to the domain service.
@Injectable()
export class GoodsReceiptsLinesService {
  constructor(
    private readonly linesService: GoodsReceiptLinesService,
    private readonly uomConversionsService: UomConversionsService,
  ) {}

  async addLine(
    goodsReceiptId: string,
    itemId: string,
    data: { goodsReceiptLotId?: string | null; locationId: string; quantity: number },
  ): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    const ctx = await this.linesService.getItemContext(goodsReceiptId, itemId);
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      ctx.inventoryItemId,
      ctx.uomId,
      data.quantity,
    );
    return this.linesService.addLine(goodsReceiptId, itemId, { ...data, primaryUomQty });
  }

  async updateLine(
    goodsReceiptId: string,
    itemId: string,
    lineId: string,
    data: { goodsReceiptLotId?: string | null; locationId?: string; quantity?: number },
  ): Promise<GoodsReceiptLineDto> {
    // Only re-snapshot the primary-UOM quantity when the line quantity changes.
    if (data.quantity === undefined) {
      return this.linesService.updateLine(goodsReceiptId, itemId, lineId, data);
    }
    const ctx = await this.linesService.getItemContext(goodsReceiptId, itemId);
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      ctx.inventoryItemId,
      ctx.uomId,
      data.quantity,
    );
    return this.linesService.updateLine(goodsReceiptId, itemId, lineId, { ...data, primaryUomQty });
  }

  removeLine(goodsReceiptId: string, itemId: string, lineId: string): Promise<SuccessResponseDto> {
    return this.linesService.removeLine(goodsReceiptId, itemId, lineId);
  }
}
