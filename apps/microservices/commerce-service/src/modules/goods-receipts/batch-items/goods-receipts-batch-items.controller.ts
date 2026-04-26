import type { GoodsReceiptBatchItemDto } from '@domain/goods-receipts/dto/entity/goods-receipt-batch-item.dto';
import { GoodsReceiptBatchItemsService } from '@domain/goods-receipts/services/goods-receipt-batch-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk';

@Controller()
export class GoodsReceiptsBatchItemsController {
  private readonly logger = new Logger(GoodsReceiptsBatchItemsController.name);

  constructor(private readonly batchItemsService: GoodsReceiptBatchItemsService) {}

  @MessagePattern({ cmd: 'goodsReceipts.batchItems' })
  batchItems(
    @Payload() data: { goodsReceiptId: string; lineId: string; batchId: string },
  ): Promise<GoodsReceiptBatchItemDto[]> {
    this.logger.log('goodsReceipts.batchItems');
    return this.batchItemsService.listByBatch(data.goodsReceiptId, data.lineId, data.batchId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.addBatchItem' })
  addBatchItem(
    @Payload() data: { goodsReceiptId: string; lineId: string; batchId: string; serialNumber: string },
  ): Promise<CreateResponseDto<GoodsReceiptBatchItemDto>> {
    this.logger.log('goodsReceipts.addBatchItem');
    return this.batchItemsService.addItem(data.goodsReceiptId, data.lineId, data.batchId, {
      serialNumber: data.serialNumber,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.updateBatchItem' })
  updateBatchItem(
    @Payload()
    data: { goodsReceiptId: string; lineId: string; batchId: string; itemId: string; serialNumber: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.updateBatchItem');
    return this.batchItemsService.updateItem(data.goodsReceiptId, data.lineId, data.batchId, data.itemId, {
      serialNumber: data.serialNumber,
    });
  }

  @MessagePattern({ cmd: 'goodsReceipts.removeBatchItem' })
  removeBatchItem(
    @Payload() data: { goodsReceiptId: string; lineId: string; batchId: string; itemId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.removeBatchItem');
    return this.batchItemsService.removeItem(data.goodsReceiptId, data.lineId, data.batchId, data.itemId);
  }
}
