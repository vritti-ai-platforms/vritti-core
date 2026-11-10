import type { GoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/entity/goods-receipt-line.dto';
import { AddGoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/request/add-goods-receipt-line.dto';
import { UpdateGoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/request/update-goods-receipt-line.dto';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsLinesService } from './services/goods-receipts-lines.service';

@Controller()
export class GoodsReceiptsLinesController {
  private readonly logger = new Logger(GoodsReceiptsLinesController.name);

  constructor(
    private readonly linesService: GoodsReceiptLinesDomainService,
    private readonly service: GoodsReceiptsLinesService,
  ) {}

  // Returns one page of a goods receipt item's lines
  @MessagePattern({ cmd: 'site.goodsReceipts.linesTable' })
  linesTable(
    @Payload() data: { goodsReceiptId: string; itemId: string } & TableState,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    this.logger.log(`site.goodsReceipts.linesTable — item: ${data.itemId}`);
    const { goodsReceiptId, itemId, ...state } = data;
    return this.linesService.findForTable(itemId, state);
  }

  // Returns one page of the lines one lot of a goods receipt item is distributed to
  @MessagePattern({ cmd: 'site.goodsReceipts.linesByLotTable' })
  linesByLotTable(
    @Payload() data: { goodsReceiptId: string; itemId: string; lotId: string } & TableState,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    this.logger.log(`site.goodsReceipts.linesByLotTable — item: ${data.itemId}, lot: ${data.lotId}`);
    const { goodsReceiptId, itemId, lotId, ...state } = data;
    return this.linesService.findForTable(itemId, state, lotId);
  }

  // Returns one line of a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.lineById' })
  lineById(@Payload() data: { goodsReceiptId: string; itemId: string; lineId: string }): Promise<GoodsReceiptLineDto> {
    this.logger.log(`site.goodsReceipts.lineById — line: ${data.lineId}`);
    return this.linesService.findById(data.itemId, data.lineId);
  }

  // Adds a line to a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.addLine' })
  addLine(@Payload() dto: AddGoodsReceiptLineDto): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    this.logger.log(`site.goodsReceipts.addLine — item: ${dto.itemId}`);
    return this.service.addLine(dto);
  }

  // Changes a line of a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.updateLine' })
  updateLine(@Payload() dto: UpdateGoodsReceiptLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.updateLine — line: ${dto.lineId}`);
    return this.service.updateLine(dto);
  }

  // Removes a line from a goods receipt item
  @MessagePattern({ cmd: 'site.goodsReceipts.removeLine' })
  removeLine(@Payload() data: { goodsReceiptId: string; itemId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeLine — line: ${data.lineId}`);
    return this.service.removeLine(data.goodsReceiptId, data.itemId, data.lineId);
  }
}
