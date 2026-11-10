import type { GoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/entity/goods-receipt-line-item.dto';
import { AddGoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/request/add-goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsDomainService } from '@domain/goods-receipt-line-items/services/goods-receipt-line-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsLineItemsService } from './services/goods-receipts-line-items.service';

@Controller()
export class GoodsReceiptsLineItemsController {
  private readonly logger = new Logger(GoodsReceiptsLineItemsController.name);

  constructor(
    private readonly lineItemsService: GoodsReceiptLineItemsDomainService,
    private readonly service: GoodsReceiptsLineItemsService,
  ) {}

  // Returns one page of the serials registered on a goods receipt line
  @MessagePattern({ cmd: 'site.goodsReceipts.lineItemsTable' })
  lineItemsTable(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string } & TableState,
  ): Promise<{ result: GoodsReceiptLineItemDto[]; count: number }> {
    this.logger.log(`site.goodsReceipts.lineItemsTable — line: ${data.lineId}`);
    const { goodsReceiptId, itemId, lineId, ...state } = data;
    return this.lineItemsService.findForTable(lineId, state);
  }

  // Registers a serial on a goods receipt line
  @MessagePattern({ cmd: 'site.goodsReceipts.addLineItem' })
  addLineItem(@Payload() dto: AddGoodsReceiptLineItemDto): Promise<CreateResponseDto<GoodsReceiptLineItemDto>> {
    this.logger.log(`site.goodsReceipts.addLineItem — line: ${dto.lineId}`);
    return this.service.addLineItem(dto);
  }

  // Removes a serial from a goods receipt line
  @MessagePattern({ cmd: 'site.goodsReceipts.removeLineItem' })
  removeLineItem(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string; subItemId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`site.goodsReceipts.removeLineItem — serial: ${data.subItemId}`);
    return this.service.removeLineItem(data.goodsReceiptId, data.itemId, data.lineId, data.subItemId);
  }
}
