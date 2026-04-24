import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';
import type { CreateGoodsReceiptDto } from './dto/request/create-goods-receipt.dto';

@Controller()
export class GoodsReceiptsController {
  private readonly logger = new Logger(GoodsReceiptsController.name);

  constructor(private readonly service: GoodsReceiptsService) {}

  // Creates a goods receipt and updates PO + inventory
  @MessagePattern({ cmd: 'goodsReceipts.create' })
  async create(@Payload() dto: CreateGoodsReceiptDto): Promise<GoodsReceiptDto> {
    this.logger.log(`goodsReceipts.create — received payload: ${JSON.stringify(dto)}`);
    this.logger.log(`goodsReceipts.create — poId: ${dto.purchaseOrderId}`);
    return this.service.create(dto);
  }

  // Returns all goods receipts for a PO
  @MessagePattern({ cmd: 'goodsReceipts.findByPoId' })
  async findByPoId(@Payload() data: { purchaseOrderId: string }): Promise<GoodsReceiptDto[]> {
    this.logger.log(`goodsReceipts.findByPoId — poId: ${data.purchaseOrderId}`);
    return this.service.findByPoId(data.purchaseOrderId);
  }

  // Returns goods receipts for table view
  @MessagePattern({ cmd: 'goodsReceipts.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log('goodsReceipts.table');
    return this.service.findForTable(state);
  }

  // Returns a goods receipt by ID
  @MessagePattern({ cmd: 'goodsReceipts.findById' })
  async findById(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log(`goodsReceipts.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }
}
