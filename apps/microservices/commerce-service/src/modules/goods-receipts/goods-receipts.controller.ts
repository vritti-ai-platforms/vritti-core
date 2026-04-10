import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateGoodsReceiptDto } from './dto/request/create-goods-receipt.dto';

@Controller()
export class GoodsReceiptsController {
  private readonly logger = new Logger(GoodsReceiptsController.name);

  constructor(private readonly service: GoodsReceiptsService) {}

  // Creates a goods receipt and updates PO + inventory
  @MessagePattern({ cmd: 'goodsReceipts.create' })
  async create(@Payload() dto: CreateGoodsReceiptDto): Promise<GoodsReceiptDto> {
    this.logger.log(`goodsReceipts.create — poId: ${dto.purchaseOrderId}`);
    return this.service.create(dto);
  }

  // Returns all goods receipts for a PO
  @MessagePattern({ cmd: 'goodsReceipts.findByPoId' })
  async findByPoId(@Payload() data: { purchaseOrderId: string }): Promise<GoodsReceiptDto[]> {
    this.logger.log(`goodsReceipts.findByPoId — poId: ${data.purchaseOrderId}`);
    return this.service.findByPoId(data.purchaseOrderId);
  }
}
