import type { GoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/entity/goods-receipt-line.dto';
import { GoodsReceiptLinesService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { GoodsReceiptsLinesService } from './services/goods-receipts-lines.service';

@Controller()
export class GoodsReceiptsLinesController {
  private readonly logger = new Logger(GoodsReceiptsLinesController.name);

  constructor(
    private readonly service: GoodsReceiptLinesService,
    private readonly appService: GoodsReceiptsLinesService,
  ) {}

  @MessagePattern({ cmd: 'site.goodsReceipts.linesTable' })
  linesTable(
    @Payload() data: { goodsReceiptId: string; itemId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    this.logger.log(`goodsReceipts.linesTable — item: ${data.itemId}`);
    const { goodsReceiptId, itemId, ...state } = data;
    return this.service.findForTable(goodsReceiptId, itemId, state);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.linesByLotTable' })
  linesByLotTable(
    @Payload() data: { goodsReceiptId: string; itemId: string; lotId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    this.logger.log(`goodsReceipts.linesByLotTable — item: ${data.itemId}, lot: ${data.lotId}`);
    const { goodsReceiptId, itemId, lotId, ...state } = data;
    return this.service.findForTable(goodsReceiptId, itemId, state, lotId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.lineById' })
  lineById(@Payload() data: { goodsReceiptId: string; itemId: string; lineId: string }): Promise<GoodsReceiptLineDto> {
    this.logger.log(`goodsReceipts.lineById — line: ${data.lineId}`);
    return this.service.findById(data.goodsReceiptId, data.itemId, data.lineId);
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.addLine' })
  addLine(
    @Payload()
    data: {
      goodsReceiptId: string;
      itemId: string;
      goodsReceiptLotId?: string | null;
      locationId: string;
      quantity: number;
    },
  ): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    this.logger.log(`goodsReceipts.addLine — item: ${data.itemId}`);
    return this.appService.addLine(data.goodsReceiptId, data.itemId, {
      goodsReceiptLotId: data.goodsReceiptLotId,
      locationId: data.locationId,
      quantity: data.quantity,
    });
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.updateLine' })
  updateLine(
    @Payload()
    data: {
      goodsReceiptId: string;
      itemId: string;
      lineId: string;
      goodsReceiptLotId?: string | null;
      locationId?: string;
      quantity?: number;
    },
  ): Promise<GoodsReceiptLineDto> {
    this.logger.log(`goodsReceipts.updateLine — line: ${data.lineId}`);
    return this.appService.updateLine(data.goodsReceiptId, data.itemId, data.lineId, {
      goodsReceiptLotId: data.goodsReceiptLotId,
      locationId: data.locationId,
      quantity: data.quantity,
    });
  }

  @MessagePattern({ cmd: 'site.goodsReceipts.removeLine' })
  removeLine(@Payload() data: { goodsReceiptId: string; itemId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.removeLine — line: ${data.lineId}`);
    return this.appService.removeLine(data.goodsReceiptId, data.itemId, data.lineId);
  }
}
