import type { GoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/entity/goods-receipt-line-item.dto';
import { AddGoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/request/add-goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsDomainService } from '@domain/goods-receipt-line-items/services/goods-receipt-line-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptsLineItemsService } from '@/modules/site/goods-receipts/line-items/services/goods-receipts-line-items.service';

@Controller()
export class LeGoodsReceiptsLineItemsController {
  private readonly logger = new Logger(LeGoodsReceiptsLineItemsController.name);

  constructor(
    private readonly lineItemsService: GoodsReceiptLineItemsDomainService,
    private readonly service: GoodsReceiptsLineItemsService,
  ) {}

  // Returns one page of the serials registered on a goods receipt line
  @MessagePattern({ cmd: 'le.goodsReceipts.lineItemsTable' })
  lineItemsTable(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string } & TableState,
  ): Promise<{ result: GoodsReceiptLineItemDto[]; count: number }> {
    this.logger.log(`le.goodsReceipts.lineItemsTable — line: ${data.lineId}`);
    const { goodsReceiptId, itemId, lineId, ...state } = data;
    return this.lineItemsService.findForTable(lineId, state);
  }

  // Registers a serial on a goods receipt line
  @MessagePattern({ cmd: 'le.goodsReceipts.addLineItem' })
  addLineItem(@Payload() dto: AddGoodsReceiptLineItemDto): Promise<CreateResponseDto<GoodsReceiptLineItemDto>> {
    this.logger.log(`le.goodsReceipts.addLineItem — line: ${dto.lineId}`);
    return this.service.addLineItem(dto);
  }

  // Removes a serial from a goods receipt line
  @MessagePattern({ cmd: 'le.goodsReceipts.removeLineItem' })
  removeLineItem(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string; subItemId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`le.goodsReceipts.removeLineItem — serial: ${data.subItemId}`);
    return this.service.removeLineItem(data.goodsReceiptId, data.itemId, data.lineId, data.subItemId);
  }
}
