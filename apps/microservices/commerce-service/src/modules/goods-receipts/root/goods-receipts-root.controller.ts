import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import type { CreateGoodsReceiptDto } from '../dto/request/create-goods-receipt.dto';
import { GoodsReceiptsPublishService } from './services/goods-receipts-publish.service';

@Controller()
export class GoodsReceiptsRootController {
  private readonly logger = new Logger(GoodsReceiptsRootController.name);

  constructor(
    private readonly service: GoodsReceiptsService,
    private readonly publishService: GoodsReceiptsPublishService,
  ) {}

  @MessagePattern({ cmd: 'goodsReceipts.create' })
  create(@Payload() dto: CreateGoodsReceiptDto): Promise<CreateResponseDto<GoodsReceiptDto>> {
    this.logger.log(`goodsReceipts.create — supplier: ${dto.supplierId}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'goodsReceipts.table' })
  table(@Payload() state: TableViewState): Promise<{ result: GoodsReceiptDto[]; count: number }> {
    this.logger.log('goodsReceipts.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'goodsReceipts.findById' })
  findById(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log('goodsReceipts.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'goodsReceipts.publish' })
  publish(@Payload() data: { id: string }): Promise<GoodsReceiptDto> {
    this.logger.log('goodsReceipts.publish');
    return this.publishService.publish(data.id);
  }

  @MessagePattern({ cmd: 'goodsReceipts.linkPo' })
  linkPurchaseOrder(@Payload() data: { id: string; purchaseOrderId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`goodsReceipts.linkPo — id: ${data.id}, po: ${data.purchaseOrderId}`);
    return this.service.linkPurchaseOrder(data.id, data.purchaseOrderId);
  }

  @MessagePattern({ cmd: 'goodsReceipts.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('goodsReceipts.delete');
    return this.service.delete(data.id);
  }
}
