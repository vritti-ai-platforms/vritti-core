import type { GoodsReceiptBatchDto } from '@domain/goods-receipts/dto/entity/goods-receipt-batch.dto';
import { GoodsReceiptBatchesService } from '@domain/goods-receipts/services/goods-receipt-batches.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk';

@Controller()
export class GoodsReceiptsBatchesController {
  private readonly logger = new Logger(GoodsReceiptsBatchesController.name);

  constructor(private readonly batchesService: GoodsReceiptBatchesService) {}

  @MessagePattern({ cmd: 'goodsReceipts.batches' })
  batches(@Payload() data: { goodsReceiptId: string; lineId: string }): Promise<GoodsReceiptBatchDto[]> {
    this.logger.log('goodsReceipts.batches');
    return this.batchesService.findByLine(data.goodsReceiptId, data.lineId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.batchById' })
  batchById(
    @Payload() data: { goodsReceiptId: string; lineId: string; batchId: string },
  ): Promise<GoodsReceiptBatchDto> {
    this.logger.log('goodsReceipts.batchById');
    return this.batchesService.findById(data.goodsReceiptId, data.lineId, data.batchId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.addBatch' })
  addBatch(
    @Payload()
    data: {
      goodsReceiptId: string;
      lineId: string;
      inventoryItemId: string;
      locationId: string;
      quantity: number;
      rejectedQuantity?: number;
      rejectionReason?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptBatchDto>> {
    this.logger.log(`goodsReceipts.addBatch — item: ${data.inventoryItemId}`);
    return this.batchesService.addBatch(data.goodsReceiptId, data.lineId, data);
  }

  @MessagePattern({ cmd: 'goodsReceipts.updateBatch' })
  updateBatch(
    @Payload()
    data: {
      goodsReceiptId: string;
      lineId: string;
      batchId: string;
      inventoryItemId?: string;
      locationId?: string;
      quantity?: number;
      rejectedQuantity?: number;
      rejectionReason?: string | null;
      manufacturingDate?: string | null;
      expiryDate?: string | null;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.updateBatch');
    return this.batchesService.updateBatch(data.goodsReceiptId, data.lineId, data.batchId, data);
  }

  @MessagePattern({ cmd: 'goodsReceipts.removeBatch' })
  removeBatch(
    @Payload() data: { goodsReceiptId: string; lineId: string; batchId: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.removeBatch');
    return this.batchesService.removeBatch(data.goodsReceiptId, data.lineId, data.batchId);
  }
}
