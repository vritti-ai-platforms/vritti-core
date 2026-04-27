import type { GoodsReceiptLineItemDto } from '@domain/goods-receipt-line-items/dto/entity/goods-receipt-line-item.dto';
import { GoodsReceiptLineItemsService } from '@domain/goods-receipt-line-items/services/goods-receipt-line-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto, TableViewState } from '@vritti/api-sdk';

@Controller()
export class GoodsReceiptsLineItemsController {
  private readonly logger = new Logger(GoodsReceiptsLineItemsController.name);

  constructor(private readonly service: GoodsReceiptLineItemsService) {}

  @MessagePattern({ cmd: 'goodsReceipts.lineItems' })
  lineItems(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string },
  ): Promise<GoodsReceiptLineItemDto[]> {
    this.logger.log(`goodsReceipts.lineItems — line: ${data.lineId}`);
    return this.service.listByLine(data.goodsReceiptId, data.itemId, data.lineId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.lineItemsTable' })
  lineItemsTable(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string } & TableViewState,
  ): Promise<{ result: GoodsReceiptLineItemDto[]; count: number }> {
    this.logger.log(`goodsReceipts.lineItemsTable — line: ${data.lineId}`);
    const { goodsReceiptId, itemId, lineId, ...state } = data;
    return this.service.findForTable(goodsReceiptId, itemId, lineId, state);
  }

  @MessagePattern({ cmd: 'goodsReceipts.addLineItem' })
  addLineItem(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string; serialNumber: string },
  ): Promise<GoodsReceiptLineItemDto> {
    this.logger.log(`goodsReceipts.addLineItem — line: ${data.lineId}`);
    return this.service.addLineItem(data.goodsReceiptId, data.itemId, data.lineId, {
      serialNumber: data.serialNumber,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.updateLineItem' })
  updateLineItem(
    @Payload()
    data: {
      goodsReceiptId: string;
      itemId: string;
      lineId: string;
      subItemId: string;
      serialNumber: string;
    },
  ): Promise<GoodsReceiptLineItemDto> {
    this.logger.log(`goodsReceipts.updateLineItem — subItem: ${data.subItemId}`);
    return this.service.updateLineItem(data.goodsReceiptId, data.itemId, data.lineId, data.subItemId, {
      serialNumber: data.serialNumber,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.removeLineItem' })
  removeLineItem(
    @Payload() data: { goodsReceiptId: string; itemId: string; lineId: string; subItemId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.removeLineItem — subItem: ${data.subItemId}`);
    return this.service.removeLineItem(data.goodsReceiptId, data.itemId, data.lineId, data.subItemId);
  }
}
