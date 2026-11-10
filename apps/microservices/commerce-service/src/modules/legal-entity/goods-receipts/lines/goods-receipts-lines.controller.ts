import type { GoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/entity/goods-receipt-line.dto';
import { AddGoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/request/add-goods-receipt-line.dto';
import { UpdateGoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/request/update-goods-receipt-line.dto';
import { GoodsReceiptLinesDomainService } from '@domain/goods-receipt-lines/services/goods-receipt-lines.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsLinesService } from '@/modules/site/goods-receipts/lines/services/goods-receipts-lines.service';

@Controller()
export class LeGoodsReceiptsLinesController {
  private readonly logger = new Logger(LeGoodsReceiptsLinesController.name);

  constructor(
    private readonly linesService: GoodsReceiptLinesDomainService,
    private readonly service: GoodsReceiptsLinesService,
  ) {}

  // Returns one page of a goods receipt item's lines
  @MessagePattern({ cmd: 'le.goodsReceipts.linesTable' })
  linesTable(
    @Payload() data: { goodsReceiptId: string; itemId: string } & TableState,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    this.logger.log(`le.goodsReceipts.linesTable — item: ${data.itemId}`);
    const { goodsReceiptId, itemId, ...state } = data;
    return this.linesService.findForTable(itemId, state);
  }

  // Returns one page of the lines one lot of a goods receipt item is distributed to
  @MessagePattern({ cmd: 'le.goodsReceipts.linesByLotTable' })
  linesByLotTable(
    @Payload() data: { goodsReceiptId: string; itemId: string; lotId: string } & TableState,
  ): Promise<{ result: GoodsReceiptLineDto[]; count: number }> {
    this.logger.log(`le.goodsReceipts.linesByLotTable — item: ${data.itemId}, lot: ${data.lotId}`);
    const { goodsReceiptId, itemId, lotId, ...state } = data;
    return this.linesService.findForTable(itemId, state, lotId);
  }

  // Returns one line of a goods receipt item
  @MessagePattern({ cmd: 'le.goodsReceipts.lineById' })
  lineById(@Payload() data: { goodsReceiptId: string; itemId: string; lineId: string }): Promise<GoodsReceiptLineDto> {
    this.logger.log(`le.goodsReceipts.lineById — line: ${data.lineId}`);
    return this.linesService.findById(data.itemId, data.lineId);
  }

  // Adds a line to a goods receipt item
  @MessagePattern({ cmd: 'le.goodsReceipts.addLine' })
  addLine(@Payload() dto: AddGoodsReceiptLineDto): Promise<CreateResponseDto<GoodsReceiptLineDto>> {
    this.logger.log(`le.goodsReceipts.addLine — item: ${dto.itemId}`);
    return this.service.addLine(dto);
  }

  // Changes a line of a goods receipt item
  @MessagePattern({ cmd: 'le.goodsReceipts.updateLine' })
  updateLine(@Payload() dto: UpdateGoodsReceiptLineDto): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.updateLine — line: ${dto.lineId}`);
    return this.service.updateLine(dto);
  }

  // Removes a line from a goods receipt item
  @MessagePattern({ cmd: 'le.goodsReceipts.removeLine' })
  removeLine(@Payload() data: { goodsReceiptId: string; itemId: string; lineId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeLine — line: ${data.lineId}`);
    return this.service.removeLine(data.goodsReceiptId, data.itemId, data.lineId);
  }
}
